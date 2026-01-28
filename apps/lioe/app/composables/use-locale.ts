import type { Locale, Schema } from "@/config/i18n.config";

export function useAppLocale() {
	const { locale } = useI18n<Schema, Locale>();

	return locale;
}
