class Course:
    def __init__(self, name, time, location, day):
        self.name = name
        self.time = time
        self.location = location
        self.day = day

    def __repr__(self):
        return str(
            {
                "name": self.name,
                "time": self.time,
                "location": self.location,
                "day": self.day,
            }
        )
