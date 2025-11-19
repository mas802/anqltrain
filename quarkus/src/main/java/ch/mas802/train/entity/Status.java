package ch.mas802.train.entity;

public class Status {

    public String state;
    public long until;
    public long deltaduration;
    public String data;

    public Status(String state, long until, long deltaduration) {
        this(state, until, deltaduration, null);
    }

    public Status(String state, long until, long deltaduration, String data) {
        this.state = state;
        this.until = until;
        this.deltaduration = deltaduration;
        this.data = data;
    }
}
