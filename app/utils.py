from typing import List
from fastapi import File
import pdfplumber
from app.course import Course


def read_pdf(file: File) -> List[List[str | None]] | None:
    pdf = pdfplumber.open(file)  # 開啟 pdf
    page = pdf.pages[0]  # 讀取第一頁
    return page.extract_table()  # 取出文字


def combine_continuous_sessions(
    courses: List[Course], max_minutes_diff: int = 20
) -> List[Course]:
    def same_day_course(course1, course2):
        return (
            course1.name == course2.name
            and course1.weekday == course2.weekday
            and course1.location == course2.location
        )

    for course in courses:
        for b_course in courses:
            # Skip Identical courses
            if course == b_course:
                continue

            # Skip non-continuous sessions
            if not same_day_course(course, b_course):
                continue

            # Check if the courses are continuous
            minutes_between = (
                (course.start_time.hour - b_course.end_time.hour) * 60
                + course.start_time.minute
                - b_course.end_time.minute
            )
            if minutes_between <= max_minutes_diff:
                # Combine continuous sessions
                course.start_time = min(course.start_time, b_course.start_time)
                course.end_time = max(course.end_time, b_course.end_time)
                courses.remove(b_course)
    return courses
