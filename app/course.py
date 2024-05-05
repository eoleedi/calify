import datetime
from icalendar import Event


class Course:
    # TODO: Define course & session
    def __init__(
        self,
        name: str,
        start_time: datetime.time,
        end_time: datetime.time,
        location: str,
        weekday: int,
    ):
        if not 1 <= weekday <= 7:
            raise ValueError("Day must be in range 1-7")
        self.name = name  # 課程名稱
        self.start_time = start_time  # 開始時間
        self.end_time = end_time  # 結束時間
        self.location = location  # 地點、教室
        self.weekday = weekday  # 星期幾

    def __repr__(self):
        return str(
            {
                "name": self.name,
                "start time": self.start_time,
                "end time": self.end_time,
                "location": self.location,
                "weekday": self.weekday,
            }
        )

    def to_ical_event(self, date: datetime.date) -> Event:
        event = Event()
        event.add("summary", self.name)
        event.add("location", self.location)
        event.add("dtstart", datetime.datetime.combine(date, self.start_time))
        event.add("dtend", datetime.datetime.combine(date, self.end_time))

        return event

    def to_ical_events(
        self, start_date: datetime.date, end_date: datetime.date
    ) -> Event:
        if start_date > end_date:
            raise ValueError("Start date must be before end date")
        weekdaydelta = datetime.timedelta(
            days=(
                self.weekday - start_date.weekday()
                if self.weekday > start_date.weekday()
                else self.weekday - start_date.weekday() + 7
            )
        )
        if start_date + weekdaydelta > end_date:
            raise ValueError("Start date + weekdaydelta must be before end date")
        event = Event()
        event.add("summary", self.name)
        event.add("location", self.location)
        event.add(
            "dtstart",
            datetime.datetime.combine(start_date + weekdaydelta, self.start_time),
        )
        event.add(
            "dtend", datetime.datetime.combine(start_date + weekdaydelta, self.end_time)
        )
        event.add("rrule", {"FREQ": "WEEKLY", "UNTIL": end_date})

        return event
