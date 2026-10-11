#include <Wire.h>

// Override with compiler.cpp.extra_flags at build time.
#ifndef I2C_SLAVE_ADDRESS
#define I2C_SLAVE_ADDRESS 11
#endif

#if I2C_SLAVE_ADDRESS < 0x08 || I2C_SLAVE_ADDRESS > 0x77
#error "I2C_SLAVE_ADDRESS must be between 0x08 and 0x77"
#endif

#ifndef WIRE_CONTROL_PINS
#if defined(ARDUINO_AVR_MEGA2560) || defined(ARDUINO_AVR_MEGA)
#define WIRE_CONTROL_PINS 22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53
#elif defined(ARDUINO_AVR_UNO)
#define WIRE_CONTROL_PINS 2,3,4,5,6,7,8,9,10,11,12,13,A0,A1,A2,A3
#else
#error "Define WIRE_CONTROL_PINS for this board"
#endif
#endif

#define PAYLOAD_SIZE 4

const int STATUS_OFF       = 0;
const int STATUS_ON        = 1;
const int STATUS_A         = 2;
const int STATUS_GREEN     = 2;
const int STATUS_B         = 3;
const int STATUS_RED       = 3;
const int STATUS_TRANS_OFF = 4;
const int STATUS_TRANS_ON  = 5;
const int STATUS_FLOCKER_OFF = 4;
const int STATUS_FLICKER_ON  = 5;
const int STATUS_BLINK    = 6;
const int STATUS_TOGGLE    = 7;
const int STATUS_BLINK_ON    = 10;
const int STATUS_BLINK_OFF   = 11;


const int pin[] = {WIRE_CONTROL_PINS};
const int PIN_COUNT = sizeof(pin) / sizeof(pin[0]);
// AVR Wire can return at most 32 status bytes per request.
static_assert(PIN_COUNT > 0 && PIN_COUNT <= 32, "Configure between 1 and 32 pins");
int status[PIN_COUNT] = {};
int value[PIN_COUNT] = {};

bool validItem(int item) {
  return item >= 0 && item < PIN_COUNT;
}


const int delta = 600;
int n = 0;
int state = 0;

// These constants won't change. They're used to give names to the pins used:
const int analogInPin[] = {A0,A2,A1}; 

int   sensorValue[] = {-1,-1,-1 };        // value read from the pot
int   lowRefValue[] = {0,0,0};      
int  highRefValue[] = {600,600,600};      
int sensorCounter[] = {0,0,0};


void setup()
{
  Serial.begin(9600); 
  Serial.println("------- XMAS2022 --------");
  delay(1000);

  Wire.begin(I2C_SLAVE_ADDRESS);
  Wire.onRequest(requestEvents);
  Wire.onReceive(receiveEvents);

  for (int i = 0; i<PIN_COUNT; i++) {
    pinMode(pin[i], OUTPUT);
  }

  for (int i = 0; i<PIN_COUNT; i++) {
    // Every second channel starts on: indices 1, 3, 5, ...
    if (i % 2 == 1) {
      turnOn(i);
    } else {
      turnOff(i);
    }
  }
}


void requestEvents()
{
    Serial.print(F("requestEvents START -- "));
    for ( int i = 0; i<PIN_COUNT; i++ ) {
      Wire.write(status[i]);
      Serial.print(status[i]);
      Serial.print(" ");
    }
    Serial.println(F(" -- requestEvents END"));
}


void receiveEvents(int numBytes)
{
  Serial.print(F("---> recieved events \tnum= "));
  Serial.println(numBytes);

  if (Wire.available() < PAYLOAD_SIZE) {
    while (Wire.available()) Wire.read();
    return;
  }

  // clear queue
  while(PAYLOAD_SIZE < Wire.available()) // loop through all but the last
  {
    int c = Wire.read();
    Serial.print( "Receive too much: " );
    Serial.println(c);
  }

    int action = Wire.read();
    int item1 = Wire.read();
    int item2 = Wire.read();
    int data = Wire.read();

    Serial.print(F("---> recieved events \titem = "));
    Serial.println(action);

    doAction(action, item1, item2);

    Serial.println(F(" receive END -- "));
}

void doAction(int action, int item1, int item2) {
    Serial.print("");
    Serial.print("doAction ");
    Serial.print(action);
    Serial.print(" - ");
    Serial.println(item1);

    switch (action) {
      case STATUS_FLICKER_ON:
        flickerToggle(item1, 50);
        flickerToggle(item2, 50);
        break;
      case STATUS_BLINK:
        toggleBlink(item1);
        toggleBlink(item2);
        break;
      case STATUS_TOGGLE:
        toggle(item1);
        toggle(item2);
        break;
      case STATUS_OFF:
        turnOff(item1);
        turnOn(item2);
        break;
      case STATUS_ON:
        turnOn(item1);
        turnOff(item2);
        break;
    }
}


void blinkUpdate(int time) {

  for(int i=0; i<PIN_COUNT; i++) {
    if ( status[i] == STATUS_BLINK ) {
      blink(i);
    } 
  }

}


void smallUpdate( int counter ) {
  
  // READ SENSORS
  /*
  for (int s = 0; s<2; s++) {
    sensorValue[s] = analogRead(analogInPin[s]);

    if ( sensorValue[s] > highRefValue[s] ) {
      sensorCounter[s]++;
      action(s);
      highRefValue[s] = 1000;
      lowRefValue[s] = 10;
    }

    if ( sensorValue[s] < lowRefValue[s] ) {
      highRefValue[s] = 600;
      lowRefValue[s] = -1;
    }
  }
  */

  for(int i=0; i<PIN_COUNT; i++) {

  // FLICKER ON
  if ( status[i] == STATUS_TRANS_ON) {
    value[i]--;
    digitalWrite(pin[i], random(0, 2));
    if ( value[i] < 0 ) {
       turnOn(i);
    }
  }

  // FLICKER OFF
  if ( status[i] == STATUS_TRANS_OFF) {
    value[i]--;
    digitalWrite(pin[i], random(0, 2));
    if ( value[i] < 0 ) {
       turnOff(i);
    }
  }

  }
}


int maincounter = 0;

int smalldelta = 20;
int bigdelta = 1000/smalldelta;

void loop() {

  maincounter++;

  if ( maincounter % bigdelta == 0 ) {
     blinkUpdate( maincounter );
  }

  smallUpdate( maincounter );

  delay(smalldelta);

}


void turnOn( int item ) {
  if (!validItem(item)) return;
  Serial.print("Turn item on: "); Serial.println(item);
  digitalWrite(pin[item], HIGH);
  status[item]=STATUS_ON;
}

void turnOff( int item ) {
  if (!validItem(item)) return;
  Serial.print("Turn item off: "); Serial.println(item);
  digitalWrite(pin[item], LOW);
  status[item]=STATUS_OFF;
}

void turnA( int item1, int item2 ) {
  if (!validItem(item1) || !validItem(item2)) return;
  Serial.print("Turn item A: "); Serial.println(item1);
  digitalWrite(pin[item1], HIGH);
  digitalWrite(pin[item2], LOW);
  status[item1]=STATUS_A;
  status[item2]=STATUS_B;
}

void turnB( int item1, int item2 ) {
  if (!validItem(item1) || !validItem(item2)) return;
  Serial.print("Turn item B: "); Serial.println(item1);
  digitalWrite(pin[item1], LOW);
  digitalWrite(pin[item2], HIGH);
  status[item1]=STATUS_B;
  status[item2]=STATUS_A;
}

void turnGreen( int item1, int item2 ) {
  turnA(item1, item2);
}

void turnRed( int item1, int item2 ) {
  turnB(item1, item2);
}

void flickerOn( int item, int duration ) {
  if (!validItem(item)) return;
  if ( status[item] != STATUS_ON ) {
      status[item] = STATUS_TRANS_ON;
      value[item] = duration;
  }
}

void flickerOff( int item, int duration ) {
  if (!validItem(item)) return;
  if ( status[item] != STATUS_OFF ) {
      status[item] = STATUS_TRANS_OFF;
      value[item] = duration;
  }
}

void toggleBlink( int item ) {
  if (!validItem(item)) return;
  if (status[item] != STATUS_BLINK) {
    blink(item);
  } else {
    turnOff(item);
  }
}

void blink( int item ) {
  if (!validItem(item)) return;
  status[item] = STATUS_BLINK;
  value[item] = !value[item];
  digitalWrite(pin[item], value[item]);
}

void toggle( int item ) {
  if (!validItem(item)) return;
  Serial.print("Toggle item: "); Serial.println(item);
  switch ( status[item] ) {
    case STATUS_ON:
    case STATUS_BLINK:
    case STATUS_TRANS_ON:
      turnOff(item);
      break;
    case STATUS_OFF:
    case STATUS_TRANS_OFF:
      turnOn(item);
      break;
  }
}



void flickerToggle( int item, int duration ) {
  if (!validItem(item)) return;
  Serial.print("Toggle item flicker: "); Serial.println(item);
  switch ( status[item] ) {
    case STATUS_ON:
    case STATUS_TRANS_ON:
      status[item] = STATUS_TRANS_OFF;
      value[item] = duration;
      break;
    case STATUS_OFF:
    case STATUS_TRANS_OFF:
      status[item] = STATUS_TRANS_ON;
      value[item] = duration;
      break;
  }
}
