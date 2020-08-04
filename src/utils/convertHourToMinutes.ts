export default function convertHoursToMinutes(time: string): Number {
    const [hour, minutes] = time.split(':').map(Number);
    return (hour * 60) + minutes;

}
