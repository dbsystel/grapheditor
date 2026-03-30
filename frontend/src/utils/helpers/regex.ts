// TODO write unit tests for these regexes
// YYYY-MM-DD
const dateRegexPattern = '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])';
export const dateRegex = new RegExp(dateRegexPattern);
export const html5DateRegex = new RegExp(`^${dateRegexPattern}$`);

// YYYY-MM-DDTHH:MM:SS[.s][(+|-)HH:MM]
export const html5DatetimeRegex =
	/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\.?(\d+)?(\+|-)?(\d{2}:\d{2})?$/;
// 1234, -1234, 1234.56, -1234.56, .56, -.56 (decimal delimiter: "." or ",")
export const html5IntegerAndFloatRegex = /^-?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
// 1234 or -1234
export const html5IntegerRegex = /^-?\d+$/;
// 1234.56 or -1234.56
export const html5FloatRegex = /^-?\d+[.,]\d+$/;
// HH:MM:SS[.s-ssssss][(+|-)HH:MM]
export const html5TimeRegex =
	/^((?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9])(?:.(\d{1,9}))?(?:([\+\-])((?:[01][0-9]|2[0-3]):[0-5][0-9]))?$/;
// true | false
export const html5BooleanRegex = /^(true|false)$/;
// PnYnMnDTnHnMnS and ISO 8601‑2 extensions (TODO use Temporal.Duration)
export const html5DurationRegex =
	/^(?<sign>[\+\-])?P(?=\d|T\d)(?<years>\d+(?:[.,]\d+)?Y)?(?<months>\d+(?:[.,]\d+)?M)?(?<weeks>\d+(?:[.,]\d+)?W)?(?<days>\d+(?:[.,]\d+)?D)?(?:T(?=\d)(?<hours>\d+(?:[.,]\d+)?H)?(?<minutes>\d+(?:[.,]\d+)?M)?(?<seconds>\d+(?:[.,]\d+)?S)?)?$/;
