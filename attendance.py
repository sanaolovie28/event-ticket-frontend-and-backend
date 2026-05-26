from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

backend_event_master_list = []

class EventCreatePayload(BaseModel):
    title: str
    time_limit: str
    description: str
    questions: Optional[List[dict]] = []

class EventResponse(BaseModel):
    id: int
    title: str
    time_limit: str
    description: str
    questions: Optional[List[dict]] = []

@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreatePayload):
    new_id = len(backend_event_master_list) + 1
    new_event = {
        "id": new_id,
        "title": payload.title,
        "time_limit": payload.time_limit,
        "description": payload.description,
        "questions": payload.questions if payload.questions else []
    }
    backend_event_master_list.append(new_event)
    return {"message": "Event successfully added!", "event_id": new_id}

@router.get("/events", response_model=List[EventResponse])
async def get_all_events():
    return backend_event_master_list

@router.get("/events/{event_id}")
async def get_single_event(event_id: str):
    try:
        target_id = int(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format.")

    event = next((e for e in backend_event_master_list if int(e["id"]) == target_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found sa master list.")
    return event