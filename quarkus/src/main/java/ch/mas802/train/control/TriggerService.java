package ch.mas802.train.control;

import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
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

    Map<String, List<String>> triggers = new ConcurrentHashMap<>();
    Map<String, AdventEntry> adventGrid = new HashMap<>();
    
    public TriggerService() {
        initialize();
        initializeAdventGrid();
    }

    public Optional<List<String>> handleTrigger(String trigger) {
        System.out.println("handleTrigger: " + trigger);
        
        // Simple lookup: trigger string -> message to send
        List<String> messages = triggers.get(trigger);
        
        if (messages != null && !messages.isEmpty()) {
            messages.forEach(message -> System.out.println("Executing trigger action: " + message));
            return Optional.of(messages);
        } else {
            System.out.println("No trigger mapping found for: " + trigger);
            return Optional.empty(); // CHECK maybe toggle here
        }
    }
    
    public void registerTrigger(String key, String... actions) {
        if (actions == null || actions.length == 0) {
            throw new IllegalArgumentException("At least one action must be provided for trigger " + key);
        }
        triggers.put(key, List.of(actions));
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
        registerTrigger("REMOTE2:LEFT:UP", "toggle:SWITCHFRONT");
        registerTrigger("REMOTE2:LEFT:STOP", "toggle:BLUE");
        registerTrigger("REMOTE2:LEFT:DOWN", "toggle:SWITCHBACK");
        
        // REMOTE2 RIGHT button
        registerTrigger("REMOTE2:RIGHT:UP", "toggle:DECOUPLERBACK");
        registerTrigger("REMOTE2:RIGHT:STOP", "toggle:CONVEYOR");
        registerTrigger("REMOTE2:RIGHT:DOWN", "toggle:DECOUPLERFRONT");

        registerTrigger("SIGNAL1:ON",  "set:SIGNAL1:OFF");
        registerTrigger("SIGNAL1:OFF", "set:SIGNAL1:ON");

        registerTrigger("CONTROL2:ON",  "set:SWITCHFRONT:ON");
        registerTrigger("CONTROL2:OFF", "set:SWITCHFRONT:OFF");

        registerTrigger("CONTROL3:ON",  "set:PUMDIRECT:CONVEYOR:45:-20");
        registerTrigger("CONTROL3:OFF", "set:PUMDIRECT:CONVEYOR:45:20");

        registerTrigger("CONTROL4:ON",  "set:MOTORDIRECT:10:3:100:103");
        registerTrigger("CONTROL4:OFF", "set:MOTORDIRECT:20:3:100:103");

        registerTrigger("WATER:ON",  "set:STRIP1:water");
        registerTrigger("WATER:OFF", "set:STRIP1:off");

        registerTrigger("MONSTER:ON",  "set:MONSTEREYES:ON", "set:STRIP1:monster");
        registerTrigger("MONSTER:OFF", "set:MONSTEREYES:OFF", "set:STRIP1:off");


        System.out.println("Initialized " + triggers.size() + " triggers");
    }

    private void initializeAdventGrid() {
        addAdventEntry("TRAIN", 0, "TRAIN", "VMuNEjnc3yk");

        addAdventEntry("SWITCHBACK", 24, "SWITCHBACK");
        addAdventEntry("SWITCHFRONT", 18, "SWITCHFRONT");
        addAdventEntry("DECOUPLERBACK", 14, "DECOUPLERBACK");
        addAdventEntry("DECOUPLERFRONT", 17, "DECOUPLERFRONT");

        addAdventEntry("LOADEE", 4, "LOADEE", "https://youtube.com/shorts/a8fP_QiH25g");
        addAdventEntry("ALLOFF", 20, "ALLOFF");
        addAdventEntry("DEMO", 7, "DEMO");
        addAdventEntry("WATER", 2, "WATER", "https://www.youtube.com/shorts/89L8v_7sH50");

        addAdventEntry("HOUSE", 1, "HOUSE", "https://www.youtube.com/shorts/PST-a_QMF-s");
        addAdventEntry("HOUSE1", 10, "HOUSE1");
        addAdventEntry("HOUSE2", 22, "HOUSE2");
        addAdventEntry("ALLLIGHTS", 12, "ALLLIGHTS");

        addAdventEntry("TRACK", 8, "TRACK");
        addAdventEntry("GHOSTBUSTERS", 13, "GHOSTBUSTERS");
        addAdventEntry("FIRE", 15, "FIRE");
        addAdventEntry("CONVEYOR", 23, "CONVEYOR");

        addAdventEntry("MONSTER", 3, "MONSTER", "https://www.youtube.com/shorts/veXRwgu2lms");
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
