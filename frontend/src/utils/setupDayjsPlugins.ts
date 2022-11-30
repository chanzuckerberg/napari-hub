import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(utc);
