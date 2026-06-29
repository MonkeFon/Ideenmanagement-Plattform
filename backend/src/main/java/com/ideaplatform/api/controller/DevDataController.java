package com.ideaplatform.api.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/dev/data")
public class DevDataController {

    private final JdbcTemplate jdbc;
    private final boolean enabled;

    private static final Set<String> HIDDEN = Set.of("flyway_schema_history", "idea_embeddings");

    public DevDataController(JdbcTemplate jdbc,
                            @Value("${ideaplatform.dev.data-console.enabled:false}") boolean enabled) {
        this.jdbc = jdbc;
        this.enabled = enabled;
    }

    private void ensureEnabled() {
        if (!enabled) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Data console disabled");
    }

    private List<String> listTables() {
        return jdbc.queryForList(
            "SELECT table_name FROM information_schema.tables " +
            "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
            String.class);
    }

    private void validateTable(String table) {
        if (HIDDEN.contains(table) || !listTables().contains(table)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown table: " + table);
        }
    }

    private List<Map<String, Object>> columnsOf(String table) {
        return jdbc.queryForList(
            "SELECT column_name, data_type, udt_name, is_nullable, column_default " +
            "FROM information_schema.columns " +
            "WHERE table_schema = 'public' AND table_name = ? ORDER BY ordinal_position",
            table);
    }

    private List<String> primaryKeyOf(String table) {
        return jdbc.queryForList(
            "SELECT kcu.column_name FROM information_schema.table_constraints tc " +
            "JOIN information_schema.key_column_usage kcu " +
            "  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema " +
            "WHERE tc.table_schema = 'public' AND tc.table_name = ? AND tc.constraint_type = 'PRIMARY KEY' " +
            "ORDER BY kcu.ordinal_position",
            String.class, table);
    }

    private Map<String, String> udtByColumn(String table) {
        Map<String, String> m = new LinkedHashMap<>();
        for (var c : columnsOf(table)) m.put((String) c.get("column_name"), (String) c.get("udt_name"));
        return m;
    }

    private void validateColumns(String table, Collection<String> cols) {
        var known = udtByColumn(table).keySet();
        for (String c : cols) {
            if (!known.contains(c)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown column: " + c);
        }
    }

    private String q(String ident) {
        return "\"" + ident.replace("\"", "\"\"") + "\"";
    }

    private Object arg(Object v) {
        return v == null ? null : v.toString();
    }

    @GetMapping("/tables")
    public List<String> tables() {
        ensureEnabled();
        var t = new ArrayList<>(listTables());
        t.removeAll(HIDDEN);
        return t;
    }

    @GetMapping("/tables/{table}")
    public Map<String, Object> rows(@PathVariable String table,
                                    @RequestParam(defaultValue = "100") int limit,
                                    @RequestParam(defaultValue = "0") int offset,
                                    @RequestParam(required = false) String orderBy,
                                    @RequestParam(defaultValue = "asc") String dir) {
        ensureEnabled();
        validateTable(table);
        var columns = columnsOf(table);
        var pk = primaryKeyOf(table);
        int lim = Math.min(Math.max(limit, 1), 500);
        int off = Math.max(offset, 0);

        String order = "";
        if (orderBy != null && !orderBy.isBlank()) {
            validateColumns(table, List.of(orderBy));
            order = " ORDER BY " + q(orderBy) + ("desc".equalsIgnoreCase(dir) ? " DESC" : " ASC");
        } else if (!pk.isEmpty()) {
            order = " ORDER BY " + q(pk.get(0));
        }

        var rows = jdbc.queryForList("SELECT * FROM " + q(table) + order + " LIMIT " + lim + " OFFSET " + off);
        Long total = jdbc.queryForObject("SELECT count(*) FROM " + q(table), Long.class);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("table", table);
        out.put("columns", columns);
        out.put("primaryKey", pk);
        out.put("rows", rows);
        out.put("total", total);
        out.put("limit", lim);
        out.put("offset", off);
        return out;
    }

    @PostMapping("/tables/{table}")
    public Map<String, Object> insert(@PathVariable String table, @RequestBody Map<String, Object> values) {
        ensureEnabled();
        validateTable(table);

        var clean = new LinkedHashMap<String, Object>();
        values.forEach((k, v) -> { if (v != null && !v.toString().isBlank()) clean.put(k, v); });
        if (clean.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No values to insert");
        validateColumns(table, clean.keySet());
        var udt = udtByColumn(table);

        StringBuilder cols = new StringBuilder();
        StringBuilder ph = new StringBuilder();
        List<Object> args = new ArrayList<>();
        int i = 0;
        for (var e : clean.entrySet()) {
            if (i++ > 0) { cols.append(", "); ph.append(", "); }
            cols.append(q(e.getKey()));
            ph.append("?::").append(udt.get(e.getKey()));
            args.add(arg(e.getValue()));
        }
        String sql = "INSERT INTO " + q(table) + " (" + cols + ") VALUES (" + ph + ") RETURNING *";
        return jdbc.queryForMap(sql, args.toArray());
    }

    @PutMapping("/tables/{table}")
    @SuppressWarnings("unchecked")
    public Map<String, Object> update(@PathVariable String table, @RequestBody Map<String, Object> body) {
        ensureEnabled();
        validateTable(table);
        var key = (Map<String, Object>) body.get("key");
        var values = (Map<String, Object>) body.get("values");
        if (key == null || key.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing key");
        if (values == null || values.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No changes");
        validateColumns(table, key.keySet());
        validateColumns(table, values.keySet());
        var udt = udtByColumn(table);

        StringBuilder set = new StringBuilder();
        List<Object> args = new ArrayList<>();
        int i = 0;
        for (var e : values.entrySet()) {
            if (i++ > 0) set.append(", ");
            if (e.getValue() == null) {
                set.append(q(e.getKey())).append(" = NULL");
            } else {
                set.append(q(e.getKey())).append(" = ?::").append(udt.get(e.getKey()));
                args.add(arg(e.getValue()));
            }
        }
        String sql = "UPDATE " + q(table) + " SET " + set + where(key, udt, args) + " RETURNING *";
        var res = jdbc.queryForList(sql, args.toArray());
        if (res.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No row matched the key");
        return res.get(0);
    }

    @DeleteMapping("/tables/{table}")
    @SuppressWarnings("unchecked")
    public Map<String, Object> delete(@PathVariable String table, @RequestBody Map<String, Object> body) {
        ensureEnabled();
        validateTable(table);
        var key = (Map<String, Object>) body.get("key");
        if (key == null || key.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing key");
        validateColumns(table, key.keySet());
        var udt = udtByColumn(table);
        List<Object> args = new ArrayList<>();
        int n = jdbc.update("DELETE FROM " + q(table) + where(key, udt, args), args.toArray());
        return Map.of("deleted", n);
    }

    private String where(Map<String, Object> key, Map<String, String> udt, List<Object> args) {
        StringBuilder w = new StringBuilder(" WHERE ");
        int i = 0;
        for (var e : key.entrySet()) {
            if (i++ > 0) w.append(" AND ");
            w.append(q(e.getKey())).append(" = ?::").append(udt.get(e.getKey()));
            args.add(arg(e.getValue()));
        }
        return w.toString();
    }
}
