package ch.mas802.train.control;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.enterprise.context.ApplicationScoped;
import javax.json.Json;
import javax.json.JsonObject;
import javax.json.JsonReader;

@ApplicationScoped
public class ConfigService {

    private static final String CONFIG_FILE_NAME = "config.json";

    private final Path configPath;
    private final JsonObject config;

    public ConfigService() {
        this.configPath = locateConfigPath();
        this.config = loadConfig(configPath);
    }

    public JsonObject getConfig() {
        return config;
    }

    public Path getConfigPath() {
        return configPath;
    }

    private static Path locateConfigPath() {
        Path currentDir = Paths.get("").toAbsolutePath();
        for (int depth = 0; depth < 6 && currentDir != null; depth++) {
            Path candidate = currentDir.resolve(CONFIG_FILE_NAME);
            if (Files.exists(candidate)) {
                return candidate;
            }
            currentDir = currentDir.getParent();
        }
        throw new IllegalStateException("Unable to find " + CONFIG_FILE_NAME + " in current or parent directories.");
    }

    private static JsonObject loadConfig(Path path) {
        try (InputStream in = Files.newInputStream(path);
             JsonReader reader = Json.createReader(in)) {
            return reader.readObject();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read config from " + path, e);
        }
    }
}
