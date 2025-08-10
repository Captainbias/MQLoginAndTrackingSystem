from sqlalchemy import create_engine, Column, Integer, String, DateTime, Date, Float, Boolean,Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import date, time,datetime

DB_FILE = 'attendance.db'

Base = declarative_base()
engine = create_engine(f'sqlite:///{DB_FILE}')
Session = sessionmaker(bind=engine)

def calc_hours(login, logout):
    dt_login = datetime.combine(date.today(), login)
    dt_logout = datetime.combine(date.today(), logout)
    delta_hours = (dt_logout - dt_login).total_seconds() / 3600
    return delta_hours

def calc_overtime(hours_worked, threshold=8):
    return max(0.0, hours_worked - threshold)

class Attendance(Base):
    __tablename__ = 'attendance'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False)  # for year-month-day only
    login_time = Column(Time, nullable=False)
    logout_time = Column(Time, nullable=False)
    hours = Column(Float, nullable=False)
    overtime_hours = Column(Float, nullable=False)
    paid = Column(Boolean, default=False)

# This will create the database file if it doesn't exist
# and create the table only if it doesn't exist
Base.metadata.create_all(engine)

def insert_initial_data_if_empty():
    session = Session()
    try:
        count = session.query(Attendance).count()
        if count == 0:
            entries = [
                Attendance(
                    name="Alice",
                    date=date(2025, 6, 10),
                    login_time=time(9, 0),
                    logout_time=time(17, 0),
                    hours=calc_hours(time(9, 0), time(17, 0)),
                    overtime_hours=calc_overtime(calc_hours(time(9, 0), time(17, 0))),
                    paid=False
                ),
                Attendance(
                    name="Bob",
                    date=date(2025, 8, 2),
                    login_time=time(10, 0),
                    logout_time=time(18, 0),
                    hours=calc_hours(time(10, 0), time(18, 0)),
                    overtime_hours=calc_overtime(calc_hours(time(10, 0), time(18, 0))),
                    paid=False
                ),
                Attendance(
                    name="Charlie",
                    date=date(2025, 7, 29),
                    login_time=time(8, 30),
                    logout_time=time(16, 30),
                    hours=calc_hours(time(8, 30), time(16, 30)),
                    overtime_hours=calc_overtime(calc_hours(time(8, 30), time(16, 30))),
                    paid=False
                ),
                Attendance(
                    name="Alice",
                    date=date(2025, 7, 15),
                    login_time=time(9, 0),
                    logout_time=time(15, 30),
                    hours=calc_hours(time(9, 0), time(15, 30)),
                    overtime_hours=calc_overtime(calc_hours(time(9, 0), time(15, 30))),
                    paid=False
                ),
                Attendance(
                    name="Alice",
                    date=date(2025, 8, 5),
                    login_time=time(9, 30),
                    logout_time=time(17, 0),
                    hours=calc_hours(time(9, 30), time(17, 0)),
                    overtime_hours=calc_overtime(calc_hours(time(9, 30), time(17, 0))),
                    paid=False
                ),
                Attendance(
                    name="Bob",
                    date=date(2025, 6, 20),
                    login_time=time(8, 45),
                    logout_time=time(16, 45),
                    hours=calc_hours(time(8, 45), time(16, 45)),
                    overtime_hours=calc_overtime(calc_hours(time(8, 45), time(16, 45))),
                    paid=False
                ),
                Attendance(
                    name="Bob",
                    date=date(2025, 7, 10),
                    login_time=time(9, 15),
                    logout_time=time(17, 15),
                    hours=calc_hours(time(9, 15), time(17, 15)),
                    overtime_hours=calc_overtime(calc_hours(time(9, 15), time(17, 15))),
                    paid=False
                ),
                Attendance(
                    name="Charlie",
                    date=date(2025, 6, 25),
                    login_time=time(10, 0),
                    logout_time=time(18, 0),
                    hours=calc_hours(time(10, 0), time(18, 0)),
                    overtime_hours=calc_overtime(calc_hours(time(10, 0), time(18, 0))),
                    paid=False
                ),
                Attendance(
                    name="Charlie",
                    date=date(2025, 8, 12),
                    login_time=time(9, 0),
                    logout_time=time(17, 0),
                    hours=calc_hours(time(9, 0), time(17, 0)),
                    overtime_hours=calc_overtime(calc_hours(time(9, 0), time(17, 0))),
                    paid=False
                ),
                Attendance(
                    name="Alice",
                    date=date(2025, 8, 20),
                    login_time=time(9, 15),
                    logout_time=time(18, 30),
                    hours=calc_hours(time(9, 15), time(18, 30)),
                    overtime_hours=calc_overtime(calc_hours(time(9, 15), time(18, 30))),
                    paid=False
                ),
                Attendance(
                    name="Bob",
                    date=date(2025, 8, 15),
                    login_time=time(7, 45),
                    logout_time=time(16, 15),
                    hours=calc_hours(time(7, 45), time(16, 15)),
                    overtime_hours=calc_overtime(calc_hours(time(7, 45), time(16, 15))),
                    paid=False
                ),
                Attendance(
                    name="Charlie",
                    date=date(2025, 7, 5),
                    login_time=time(8, 0),
                    logout_time=time(17, 0),
                    hours=calc_hours(time(8, 0), time(17, 0)),
                    overtime_hours=calc_overtime(calc_hours(time(8, 0), time(17, 0))),
                    paid=False
                ),
            ]

            session.add_all(entries)
            session.commit()
            print("Inserted initial attendance records.")
        else:
            print("Attendance table already has data; no insertion performed.")
    finally:
        session.close()

def kill():
    session = Session()
    session.query(Attendance).delete()
    session.commit()
    session.close()

#kill()
insert_initial_data_if_empty()