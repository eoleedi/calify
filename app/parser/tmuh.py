from typing import List
import datetime
import pandas as pd
import re
from app.course import Course
from app.utils import combine_continuous_sessions



class FullTimeTableParser:
    def dataframe_to_courses(self, data: pd.DataFrame) -> List[Course]:
        courses = []
        table_df = data

        # 重新命名欄位
        table_df.columns = ["上課時間", "節次"] + list(range(1, 8))

        for _index, row in table_df.iterrows():
            for column_name, item in row[2:].items():  # 略過前兩欄 (第幾節課, 上課時間)
                # 檢查是否為空值或空字串
                if not isinstance(item, str) or item == "":
                    continue

                # 讀取課程名稱、地點
                information = [x.strip() for x in item.split("\n")]
                name = "".join(information[1:-1])
                location = information[-1]


                # 新增課程
                courses.append(
                    Course(
                        name=name,
                        start_time=datetime.datetime.strptime(
                            row["上課時間"].split("\n")[0].strip(),
                            "%H:%M",
                        ).time(),
                        end_time=datetime.datetime.strptime(
                            row["上課時間"].split("\n")[2].strip(),
                            "%H:%M",
                        ).time(),
                        location=location,
                        weekday=column_name,
                    )
                )

        return combine_continuous_sessions(courses)

    def table_to_dataframe(self, table: List[List[str | None]] | None) -> pd.DataFrame:
        return pd.DataFrame(table[1:], columns=table[0])

    def table_to_courses(self, table: List[List[str | None]] | None) -> List[Course]:
        return self.dataframe_to_courses(self.table_to_dataframe(table))
    
class Semester:
    def __init__(self):
        self._semester_to_date = {
            "112-1": (datetime.date(2023, 9, 11), datetime.date(2024, 1, 14)),
            "112-2": (datetime.date(2024, 2, 19), datetime.date(2024, 6, 23)),
            "113-1": (datetime.date(2024, 9, 9), datetime.date(2025, 1, 10)),
            "113-2": (datetime.date(2025, 2, 17), datetime.date(2025, 6, 20)),
        }

    def get_date(self, semester: str) -> tuple[datetime.date, datetime.date]:
        return self._semester_to_date[semester]