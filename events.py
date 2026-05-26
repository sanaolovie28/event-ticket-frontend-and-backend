from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.event import Event
from app.models.user import User
from app.schemas.event import EventCreate
from app.schemas.response import EventResponse
from app.schemas.user import UserCreate
from app.schemas.user import UserLogin
from app.schemas.question import EventQuestionCreate
from app.models.event_question import EventQuestion

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/events")
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    new_event = Event(
        title=event.title,
        description=event.description,
        time_limit=event.time_limit,
        venue=getattr(event, 'venue', "TBA")
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return {
        "message": "Event created successfully", 
        "id": new_event.id,
        "title": new_event.title,
        "description": new_event.description,
        "time_limit": new_event.time_limit
    }

@router.get("/events")
def get_events(db: Session = Depends(get_db)):
    return db.query(Event).all()

@router.post("/events/{event_id}/questions")
def add_question(event_id: int, question: EventQuestionCreate, db: Session = Depends(get_db)):
    new_question = EventQuestion(
        event_id=event_id,
        question_text=question.question_text,
        question_type=question.question_type,
        required=question.required
    )

    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return new_question