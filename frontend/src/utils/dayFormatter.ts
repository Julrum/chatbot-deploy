import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(timezone);
dayjs.extend(utc);

export const dayFormatter = (
  date?: string | number | Date | dayjs.Dayjs | null | undefined,
  template?: string,
  options?: { locale?: string; isZuluTime?: boolean },
) => {
  dayjs.locale(options?.locale ?? 'en');
  return dayjs(date)
    .utc(!(options?.isZuluTime ?? false))
    .tz(dayjs.tz.guess())
    .format(template);
};
