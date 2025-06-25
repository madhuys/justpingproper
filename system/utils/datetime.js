const {
    DateTime,
} = require('luxon');

const getCurrentUnixTimestamp = () => Math.floor((DateTime.local().valueOf()) / 1000);

const convertStringToUnixTimestamp = (timeString, format, timezone) => Math.floor((DateTime.fromFormat(timeString, format, {
    zone: timezone,
}).valueOf()) / 1000);

const getStartOfDay = (timestamp, timezone) => (DateTime.fromMillis(timestamp * 1000).setZone(timezone).startOf('day').valueOf()) / 1000;

const getEndOfDay = (timestamp, timezone) => Math.floor((DateTime.fromMillis(timestamp * 1000).setZone(timezone).endOf('day').valueOf()) / 1000);

const formatUnixTimestamp = (timestamp, timezone, format) => DateTime.fromMillis(timestamp * 1000).setZone(timezone).toFormat(format);

const mongoFormatedDateTime = (dateTime, dateFormat = '%d/%m/%Y', timeZoneEnable = false, timeZoneType = 'Asia/Singapore') => {
    const convertFormat = {
        format: dateFormat,
        date: dateTime,
    };
    if (timeZoneEnable === true) {
        convertFormat.timezone = timeZoneType;
    }
    return {
        $dateToString: convertFormat,
    };
};

const convertTimestampToFormat = (timestamp, timezone, format) => {
    return DateTime.fromMillis(timestamp * 1000).setZone(timezone).toFormat(format);
};

module.exports = {
    getCurrentUnixTimestamp,
    convertStringToUnixTimestamp,
    getStartOfDay,
    getEndOfDay,
    formatUnixTimestamp,
    mongoFormatedDateTime,
    convertTimestampToFormat
};