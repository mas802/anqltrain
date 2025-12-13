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

    public boolean handlesKey(String key) {
        if (key == null || key.isEmpty()) {
            return false;
        }
        String prefix = key + ":";
        return triggers.keySet().stream().anyMatch(trigger -> trigger.startsWith(prefix));
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

        registerTrigger("MONSTER:ON",  "set:MONSTEREYES:ON", "set:STRIP1:rainbow");
        registerTrigger("MONSTER:OFF", "set:MONSTEREYES:OFF", "set:STRIP1:water");

        registerTrigger("GHOSTBUSTERS:ON",  "set:ECTO1:ON", "set:STRIP1:ghost", "set:STRIP2:ghost", "set:STRIP2:ghost");
        registerTrigger("GHOSTBUSTERS:OFF", "set:ECTO1:OFF", "set:STRIP2:off", "set:STRIP1:water", "set:STRIP3:off");

        registerTrigger("FIRE:ON",  "set:FIRETRUCK:ON", "set:STRIP2:fire");
        registerTrigger("FIRE:OFF", "set:FIRETRUCK:OFF", "set:STRIP2:off");

        registerTrigger("THEFORCE:ON",  "toggle:UNLOADER");
        registerTrigger("THEFORCE:OFF", "toggle:UNLOADER");

        registerTrigger("HOUSE1:ON",  "set:STRIP2:white");
        registerTrigger("HOUSE1:OFF", "set:STRIP2:off");

        registerTrigger("HOUSE2:ON",  "set:STRIP3:white");
        registerTrigger("HOUSE2:OFF", "set:STRIP3:off");

        registerTrigger("DISCO:ON",  "set:STRIP1:rainbow", "set:STRIP2:rainbow");
        registerTrigger("DISCO:OFF", "set:STRIP1:water", "set:STRIP2:off");

        System.out.println("Initialized " + triggers.size() + " triggers");
    }

    private void initializeAdventGrid() {
        addAdventEntry("TRAIN", 0, "TRAIN", "05mHbaKsyiA");
        addAdventEntry("HOUSE", 1, "HOUSE", "https://www.youtube.com/shorts/PST-a_QMF-s");
        addAdventEntry("WATER", 2, "WATER", "https://www.youtube.com/shorts/89L8v_7sH50");
        addAdventEntry("MONSTER", 3, "MONSTER", "https://www.youtube.com/shorts/veXRwgu2lms");
        addAdventEntry("THEFORCE", 5, "THEFORCE", "https://www.youtube.com/shorts/mqlW0Mv2PFg");
        addAdventEntry("LOADEE", 4, "LOADEE", "https://www.youtube.com/shorts/EJD-zyAX19E");
        addAdventEntry("SANTA", 6, "SANTA", "https://www.youtube.com/shorts/pipAMLV4u-E");
        addAdventEntry("PLAN", 7, "PLAN");
    
        addAdventEntry("TRACK", 8, "TRACK", "https://www.youtube.com/shorts/GMEniMG16bk");
        addAdventEntry("HOUSE1", 9, "HOUSE1", "https://www.youtube.com/shorts/1Pk2WoBNbSA");
        addAdventEntry("SWAP", 10, "SWAP", "https://www.youtube.com/watch?v=5JWH4Ad17Z8");
        addAdventEntry("HOUSE2", 11, "HOUSE2", "https://www.youtube.com/shorts/73ISAS7pEqE");
        addAdventEntry("ALLLIGHTS", 12, "ALLLIGHTS"); 
        addAdventEntry("FIRE", 13, "FIRE", "https://www.youtube.com/shorts/ZI7yNRBOeIw");
    addAdventEntry("SWITCHBACK", 14, "SWITCHBACK"); // EASY
            addAdventEntry("GHOSTBUSTERS", 15, "GHOSTBUSTERS");
                addAdventEntry("ALLON", 16, "ALLON"); // ?
        addAdventEntry("YARD", 17, "YARD"); // YARD
    addAdventEntry("ALLOFF", 18, "ALLOFF"); // REPLACE MEDIUM
            addAdventEntry("GUGGE", 19, "GUGGE");
    addAdventEntry("SWITCHFRONT", 20, "SWITCHFRONT"); // REPLACE HARD
            addAdventEntry("CONVEYOR", 21, "CONVEYOR");
        addAdventEntry("CAVE", 22, "CAVE");
    addAdventEntry("DRAGON", 23, "DRAGON"); // REPLACEME IMPOSSIBLE
        addAdventEntry("LOADER", 24, "LOADER"); // LOADER
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
