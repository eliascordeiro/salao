import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { locales, defaultLocale, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const acceptLang = headers().get("accept-language") || "";
  const browserLang = acceptLang.split(",")[0].split("-")[0].toLowerCase();

  let locale: Locale = defaultLocale;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else if (locales.includes(browserLang as Locale)) {
    locale = browserLang as Locale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
