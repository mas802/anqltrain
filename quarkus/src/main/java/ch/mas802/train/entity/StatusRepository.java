package ch.mas802.train.entity;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.ArrayList;

import javax.enterprise.context.ApplicationScoped;

import ch.mas802.train.entity.Status;

@ApplicationScoped
public class StatusRepository {

    private Map<String, Status> data = new ConcurrentHashMap<>();

    public Status getStatus(final String key) {
    	Status raw = data.get(key);
        if (raw == null) {
            return new Status( "load", -1, 500);
        }
        System.out.println( System.currentTimeMillis() + " get " + raw.state + " - " + (raw.until-System.currentTimeMillis()) + " - " + raw.deltaduration);
        return new Status( raw.state, raw.until-System.currentTimeMillis(), raw.deltaduration, raw.data);
    }

    public Status updateStatus(final String key, final String status, final long deltaduration) {
        return updateStatus(key, status, deltaduration, null);
    }

    public Status updateStatus(final String key, final String status, final long deltaduration, final String dataValue) {
        Status raw = new Status( status, System.currentTimeMillis()+deltaduration, deltaduration, dataValue);
        System.out.println( System.currentTimeMillis() + " set " + raw.state + " - " + (System.currentTimeMillis()+deltaduration) + " - " + deltaduration);
        data.put(key, raw);
        return new Status( raw.state, raw.until-System.currentTimeMillis(), deltaduration, raw.data);
    }

    public Map<String, Status> status() {
        return data;
    }
}
