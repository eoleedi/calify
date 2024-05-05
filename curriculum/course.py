class Course:
    def __init__(self, name, time, location, day):
        self.name = name            # 課程名稱
        self.time = time            # 時間
        self.location = location    # 地點、教室
        self.day = day              # 星期幾

    def __repr__(self):
        return str(
            {
                "name": self.name,
                "time": self.time,
                "location": self.location,
                "day": self.day,
            }
        )
