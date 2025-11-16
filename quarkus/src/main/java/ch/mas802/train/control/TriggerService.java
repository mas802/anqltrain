package ch.mas802.train.control;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Optional;

import javax.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class TriggerService {

    Map<String, String> triggers = new ConcurrentHashMap<>();
    
    public TriggerService() {
        initialize();
    }

    public Optional<String> handleTrigger(String trigger) {
        System.out.println("handleTrigger: " + trigger);
        
        // Simple lookup: trigger string -> message to send
        String message = triggers.get(trigger);
        
        if (message != null) {
            System.out.println("Executing trigger action: " + message);
            return Optional.of(message);
        } else {
            System.out.println("No trigger mapping found for: " + trigger);
            return Optional.empty(); // CHECK maybe toggle here
        }
    }
    
    public void registerTrigger(String key, String action) {
        triggers.put(key, action);
    }
    
    public void clearTriggers() {
        triggers.clear();
    }
    
    public void initialize() {
        // Fill triggers map with mappings from remoteConfigs
        // REMOTE2 LEFT button
        triggers.put("REMOTE2:LEFT:UP", "toggle:SWITCHFRONT");
        triggers.put("REMOTE2:LEFT:STOP", "toggle:BLUE");
        triggers.put("REMOTE2:LEFT:DOWN", "toggle:SWITCHBACK");
        
        // REMOTE2 RIGHT button
        triggers.put("REMOTE2:RIGHT:UP", "toggle:DECOUPLERBACK");
        triggers.put("REMOTE2:RIGHT:STOP", "toggle:CONVEYOR");
        triggers.put("REMOTE2:RIGHT:DOWN", "toggle:DECOUPLERFRONT");

        triggers.put("SIGNAL1:ON",  "set:SIGNAL1:OFF");
        triggers.put("SIGNAL1:OFF", "set:SIGNAL1:ON");

        triggers.put("CONTROL2:ON",  "set:SWITCHFRONT:ON");
        triggers.put("CONTROL2:OFF", "set:SWITCHFRONT:OFF");

        triggers.put("CONTROL3:ON",  "set:PUMDIRECT:CONVEYOR:45:-20");
        triggers.put("CONTROL3:OFF", "set:PUMDIRECT:CONVEYOR:45:20");

        triggers.put("CONTROL4:ON",  "set:MOTORDIRECT:10:3:120:105");
        triggers.put("CONTROL4:OFF", "set:MOTORDIRECT:20:3:120:105");

        System.out.println("Initialized " + triggers.size() + " triggers");
    }

}
