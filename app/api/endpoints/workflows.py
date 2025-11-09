from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_workflows():
    return {"message": "Workflows endpoint is active 🚀"}
