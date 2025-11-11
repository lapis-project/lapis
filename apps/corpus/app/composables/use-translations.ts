import type { Locale, Schema } from "@/app/config/i18n.config";

export type TranslateFn = ReturnType<typeof useTranslations>;

export function useTranslations() {
	const { t } = useI18n<Schema, Locale>();

	return t;
}
