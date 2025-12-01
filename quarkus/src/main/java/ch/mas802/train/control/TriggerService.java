package ch.mas802.train.control;

import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import javax.enterprise.context.ApplicationScoped;

import ch.mas802.train.entity.Status;

@ApplicationScoped
public class TriggerService {

    private static final long[] DECEMBER_2025_DAY_STARTS = new long[25];

    static {
        for (int day = 1; day <= 24; day++) {
            DECEMBER_2025_DAY_STARTS[day] = LocalDate.of(2025, Month.DECEMBER, day)
                    .atStartOfDay(ZoneOffset.UTC)
                    .toEpochSecond();
        }
    }

    Map<String, String> triggers = new ConcurrentHashMap<>();
    Map<String, AdventEntry> adventGrid = new HashMap<>();
    
    public TriggerService() {
        initialize();
        initializeAdventGrid();
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

    public Map<String, AdventEntry> getAdventGrid() {
        return Collections.unmodifiableMap(adventGrid);
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

        triggers.put("CONTROL4:ON",  "set:MOTORDIRECT:10:3:100:103");
        triggers.put("CONTROL4:OFF", "set:MOTORDIRECT:20:3:100:103");

        System.out.println("Initialized " + triggers.size() + " triggers");
    }

    private void initializeAdventGrid() {
        addAdventEntry("TRAIN", 0, "TRAIN", "VMuNEjnc3yk");

        addAdventEntry("SWITCHBACK", 24, "SWITCHBACK");
        addAdventEntry("SWITCHFRONT", 18, "SWITCHFRONT");
        addAdventEntry("DECOUPLERBACK", 14, "DECOUPLERBACK");
        addAdventEntry("DECOUPLERFRONT", 4, "DECOUPLERFRONT");

        addAdventEntry("LOADEE", 2, "LOADEE", "https://youtube.com/shorts/a8fP_QiH25g?si=N4v5ZlKRXY38xSgz");
        addAdventEntry("ALLOFF", 20, "ALLOFF");
        addAdventEntry("DEMO", 7, "DEMO");
        addAdventEntry("CROSSING", 4, "CROSSING");

        addAdventEntry("HOUSE", 1, "HOUSE" , "https://www.youtube.com/shorts/PST-a_QMF-s");
        addAdventEntry("HOUSE1", 10, "HOUSE1");
        addAdventEntry("HOUSE2", 22, "HOUSE2");
        addAdventEntry("ALLLIGHTS", 12, "ALLLIGHTS");

        addAdventEntry("TRACK", 8, "TRACK");
        addAdventEntry("GHOSTBUSTERS", 3, "GHOSTBUSTERS");
        addAdventEntry("FIRE", 15, "FIRE");
        addAdventEntry("CONVEYOR", 23, "CONVEYOR");

        addAdventEntry("MONSTER", 17, "MONSTER");
        addAdventEntry("CAVE", 5, "CAVE");
        addAdventEntry("GUGGE", 19, "GUGGE");
        addAdventEntry("DRAGON", 9, "DRAGON");

        addAdventEntry("SIGNAL1", 21, "SIGNAL1");
        addAdventEntry("SIGNAL2", 11, "SIGNAL2");
        addAdventEntry("SANTA", 6, "SANTA");
        addAdventEntry("ALLON", 16, "ALLON");
    }

    private void addAdventEntry(String key, int day, String action) {
        addAdventEntry(key, day, action, null);
    }

    private void addAdventEntry(String key, int day, String action, String data) {
        adventGrid.put(key, new AdventEntry(day, action, data));
    }

    public Status buildAdventStatus(String key, long epochSecond) {
        AdventEntry event = adventGrid.get(key);
        if (event == null || event.day()<1) {
            return null;
        }
        long eventStartEpochSecond = DECEMBER_2025_DAY_STARTS[event.day()];
        if (epochSecond > eventStartEpochSecond) {
            return null;
        }
        System.out.println("Advent event " + key + " at " + epochSecond);
        String adventState = String.format("ADVENT_%02d", event.day());
        return new Status(adventState, 10000, 2000);
    }

    public static final class AdventEntry {
        private final int day;
        private final String action;
        private final String data;

        public AdventEntry(int day, String action, String data) {
            this.day = day;
            this.action = action;
            this.data = data;
        }

        public int day() {
            return day;
        }

        public String action() {
            return action;
        }

        public String data() {
            return data;
        }
    }
}
