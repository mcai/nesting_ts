import { Moment } from "moment";

export class SimpleFormatting {
    static toFormattedDateTimeString(moment: Moment): string {
        return moment.format("YYYY-MM-DD HH:mm:ss");
    }
}
