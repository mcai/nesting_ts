import moment, { Moment } from "moment";

export function toFormattedDateTimeString(moment: Moment): string {
    return moment.format("YYYY-MM-DD HH:mm:ss");
}

export function time(name: (result: any) => string, func: () => any) {
    const start = new Date().getTime();

    const result = func();

    const end = new Date().getTime();
    const time = end - start;

    const now = toFormattedDateTimeString(moment());

    console.log(`[${now}] ${name(result)} 用时${time}毫秒`);

    return result;
}

export const partToPartGap = 5.0;
export const partToSheetGap = 5.0;

export const tolerance = 0.05;
export const noFitPolygonTolerance = 0.25;

export const clipperScale = 100.0;
