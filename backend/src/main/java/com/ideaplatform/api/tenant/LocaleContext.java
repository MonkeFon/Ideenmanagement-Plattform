package com.ideaplatform.api.tenant;

/**
 * Request-scoped locale carrier — populated by {@link LocaleFilter} from the
 * {@code X-Content-Lang} header. Used by services that pick translated columns
 * out of the database (e.g. ideas, campaigns).
 *
 * Two values are recognised:
 *   "de" — return German fields if non-null, otherwise the original
 *   anything else (incl. unset) — return the original English columns
 */
public final class LocaleContext {

    private static final ThreadLocal<String> LOCALE = new ThreadLocal<>();

    private LocaleContext() {}

    public static void set(String locale) {
        LOCALE.set(locale == null ? null : locale.trim().toLowerCase());
    }

    public static String get() {
        String l = LOCALE.get();
        return l == null ? "en" : l;
    }

    public static boolean isGerman() { return "de".equals(get()); }

    public static void clear() { LOCALE.remove(); }
}
