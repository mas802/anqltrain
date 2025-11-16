#include <Wire.h>
#include "AFMotor.h"

#define I2C_SLAVE_ADDRESS 14

AF_DCMotor motors[4] = {
  AF_DCMotor(1),
  AF_DCMotor(2),
  AF_DCMotor(3),
  AF_DCMotor(4)
};

int min = 70;
int max = 250;
int diff = max-min;
int target = 100;
int motorStatus[4] = {0, 0, 0, 0};

// Motor timer structure for non-blocking delays
struct MotorTimer {
  unsigned long stopTime;  // When the motor should stop (millis())
  bool active;              // Whether timer is active
};

MotorTimer motorTimers[4] = {{0, false}, {0, false}, {0, false}, {0, false}};

const int IDLE = 0;
const int TRAIN_STARTFORWARD = 11;
const int TRAIN_FORWARD = 10;
const int TRAIN_BACKWARD = 20;
const int CROSSING_UP = 21;
const int CROSSING_DOWN = 22;

const int SETSPEED_LOW = 100;
const int SETSPEED_HIGH = 200;
const int SETSPEED_DIFF = (SETSPEED_HIGH - SETSPEED_LOW)/2;
const int SETSPEED_MID = SETSPEED_LOW + SETSPEED_DIFF;
const int MAX_DURATION = 20000;

const int STOP = 99;


int action = IDLE;
int motorSelect = 0;
int duration = 0;
int value = 0;

int i = 0;

int incomingByte = 0; // for incoming serial data

void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps
  Serial.println("Motor getting ready");

  Wire.begin(I2C_SLAVE_ADDRESS);
  Wire.onRequest(requestEvents);
  Wire.onReceive(receiveEvents);

  // turn on all motors
  for (int i = 0; i < 4; i++) {
    setMotor(i, RELEASE, 0);
  }
  Serial.println("Motor ready!");
}


void requestEvents()
{
  // Send status of all 4 motors
  for (int i = 0; i < 4; i++) {
    Wire.write(motorStatus[i]);
  }
}


void receiveEvents(int numBytes)
{
  while(4 < Wire.available()) // discard surplus bytes
  {
    int c = Wire.read();
    Serial.print( "Receive too much: " );
    Serial.println(c);
  }
  action = Wire.read();
  motorSelect = Wire.read();
  duration = Wire.read()*100;
  value = Wire.read();

  if (duration < 1 || duration > MAX_DURATION) {
    duration = MAX_DURATION;
  }

  Serial.print( "Receive: " );
  Serial.print(action);
  Serial.print( " - " );
  Serial.print(motorSelect);
  Serial.print( " - " );
  Serial.print(duration);
  Serial.print( " - " );
  Serial.println(value);
}

void setMotor(int motorIndex, uint8_t mode, int speed)
{

  Serial.print( "Set Motor: " );
  Serial.print(motorIndex);
  Serial.print( " - " );
  Serial.print(mode);
  Serial.print( " - " );
  Serial.print(speed);
  Serial.print( " - " );
  Serial.println(mode);

  // Validate motor index
  if (motorIndex < 0 || motorIndex >= 4) {
    return;
  }
  
  // Set motor mode and speed
  motors[motorIndex].run(mode);
  motors[motorIndex].setSpeed(speed);
  
  // Update status array (use absolute value for status)
  if (mode == RELEASE || speed == 0) {
    motorStatus[motorIndex] = 0;
    // Cancel any scheduled stop for this motor
    motorTimers[motorIndex].active = false;
  } else {
    motorStatus[motorIndex] = speed;
  }
}

void setMotorWithDuration(int motorIndex, uint8_t mode, int speed, unsigned long durationMs)
{
  // Set the motor
  setMotor(motorIndex, mode, speed);
  
  // Schedule automatic stop after duration
  if (durationMs > 0) {
    motorTimers[motorIndex].stopTime = millis() + durationMs;
    motorTimers[motorIndex].active = true;
  }
}

void checkMotorTimers()
{
  // Check all motor timers and stop motors when their time is up
  unsigned long currentTime = millis();
  
  for (int i = 0; i < 4; i++) {
    if (motorTimers[i].active && currentTime >= motorTimers[i].stopTime) {
      setMotor(i, RELEASE, 0);
      motorTimers[i].active = false;
    }
  }
}

void loop() {

  // Always check motor timers first (non-blocking)
  checkMotorTimers();

  if (action == IDLE) {
    if (i++>100) {
      Serial.println("alive");
      i=0;
    }
  } else {
    Serial.println(action);
  }
  
  if (action == TRAIN_STARTFORWARD) {
    // Blocking sequence for simplicity
    setMotor(motorSelect, BACKWARD, min);
    delay(duration);

    setMotor(motorSelect, FORWARD, max);
    delay(duration);

    setMotor(motorSelect, FORWARD, value);
    action = IDLE;

  } else if (action == TRAIN_FORWARD) { 

    setMotorWithDuration(motorSelect, FORWARD, value, duration);
    action = IDLE;

  } else if (action == TRAIN_BACKWARD) { 

    setMotorWithDuration(motorSelect, BACKWARD, value, duration);
    action = IDLE;

  } else if (action == CROSSING_DOWN) { 

    // Use non-blocking duration - motor will stop automatically
    setMotorWithDuration(motorSelect, FORWARD, value, duration);
    action = IDLE;

  } else if (action == CROSSING_UP) { 

    // Use non-blocking duration - motor will stop automatically
    setMotorWithDuration(motorSelect, BACKWARD, value, duration);
    action = IDLE;

  } else if (action == STOP) { 

    setMotor(motorSelect, RELEASE, 0);
    action = IDLE;

  } else if (action >= SETSPEED_LOW && action <= SETSPEED_HIGH) {

    int speedValue = min + (diff*(action-SETSPEED_MID))/(SETSPEED_DIFF);

    if (speedValue < 0) {
      setMotorWithDuration(motorSelect, FORWARD, -speedValue, duration);
    } else if (speedValue > 0) {
      setMotorWithDuration(motorSelect, BACKWARD, speedValue, duration);
    } else {
      setMotor(motorSelect, RELEASE, 0);
    }

    Serial.println(action);
    Serial.println(speedValue);

    action = IDLE;

  }

  delay(100);
//  Serial.println("tick alive motor");

}
