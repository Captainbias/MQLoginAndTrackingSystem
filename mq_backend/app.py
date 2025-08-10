from flask import Flask, request, jsonify
from sqlalchemy import create_engine,extract, and_, func
from sqlalchemy.orm import sessionmaker
from models import Base, Attendance, insert_initial_data_if_empty
from datetime import datetime, date
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

engine = create_engine('sqlite:///attendance.db')
Session = sessionmaker(bind=engine)

insert_initial_data_if_empty()  # insert initial data only if table empty

@app.route('/add_entry', methods=['POST'])
def add_entry():
    data = request.json
    session = Session()
    try:
        entry = Attendance(
            name=data['name'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            login_time=datetime.strptime(data['login_time'], '%H:%M').time(),
            logout_time=datetime.strptime(data['logout_time'], '%H:%M').time(),
            hours = float(data['hours']),
            overtime_hours = float(data['overtime_hours']),
            paid=bool(data['paid'])
        )
        session.add(entry)
        session.commit()
        return jsonify({"message": "Entry added successfully"}), 201
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        session.close()

@app.route('/update_entry/<int:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    data = request.json
    session = Session()
    try:
        entry = session.query(Attendance).filter_by(id=entry_id).first()
        if not entry:
            return jsonify({"error": "Entry not found"}), 404
        # Overwrite all fields
        entry.name = data['name']
        entry.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        entry.login_time = datetime.strptime(data['login_time'], '%H:%M')
        entry.logout_time = datetime.strptime(data['logout_time'], '%H:%M')
        entry.hours = float(data['hours'])
        entry.overtime_hours = float(data['overtime_hours'])
        entry.paid = bool(data['paid'])
        session.commit()
        return jsonify({"message": "Entry updated successfully"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        session.close()

@app.route('/delete_entry/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    session = Session()
    try:
        entry = session.query(Attendance).filter_by(id=entry_id).first()
        if not entry:
            return jsonify({"error": "Entry not found"}), 404

        session.delete(entry)
        session.commit()
        return jsonify({"message": "Entry deleted successfully"}), 200
    except Exception as e:
        session.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        session.close()

# /attendance/unpaid?name=Alice
@app.route('/attendance/unpaid', methods=['GET'])
def get_unpaid_attendance_by_worker():
    worker_name = request.args.get('name')  # worker's name from query string
    if not worker_name:
        return jsonify({"error": "Missing 'name' parameter"}), 400

    session = Session()
    try:
        records = (
            session.query(Attendance)
            .filter(
                Attendance.name == worker_name,
                Attendance.paid == False
            )
            .order_by(Attendance.date.desc())  # sort newest first
            .all()
        )

        results = []
        for r in records:
            results.append({
                "id": r.id,
                "name": r.name,
                "date": r.date.strftime('%Y-%m-%d') if r.date else None,
                "login_time": r.login_time.strftime('%H:%M') if r.login_time else None,
                "logout_time": r.logout_time.strftime('%H:%M') if r.logout_time else None,
                "hours": r.hours,
                "overtime_hours": r.overtime_hours,
                "paid": r.paid,
            })

        return jsonify(results), 200
    finally:
        session.close()

#/annual_review?year=2025
@app.route('/annual_review', methods=['GET'])
def annual_review():
    year_str = request.args.get('year')
    if not year_str or not year_str.isdigit():
        return jsonify({"error": "Please provide a valid 'year' query parameter, e.g. ?year=2025"}), 400

    year = int(year_str)
    session = Session()
    try:
        hours_expr = func.strftime('%s', Attendance.logout_time) - func.strftime('%s', Attendance.login_time)#?
        results = session.query(
            Attendance.name,
            extract('month', Attendance.login_time).label('month'),
            func.sum(hours_expr / 3600).label('total_hours')
        ).filter(
            extract('year', Attendance.login_time) == year
        ).group_by(
            Attendance.name,
            extract('month', Attendance.login_time)
        ).order_by(
            Attendance.name,
            extract('month', Attendance.login_time)
        ).all()

        report = {}
        for name, month, total_hours in results:
            if name not in report:
                report[name] = {}
            report[name][month] = round(total_hours or 0, 2)

        return jsonify(report), 200
    finally:
        session.close()

#/workers
@app.route('/workers', methods=['GET'])
def get_worker_list():
    session = Session()
    workers = session.query(Attendance.name).distinct().all()
    unique_names = [name for (name,) in workers]
    return jsonify(unique_names)

if __name__ == '__main__':
    app.run(debug=True)
