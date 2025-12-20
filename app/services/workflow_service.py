import asyncio
import json
from app.services.run_manager import run_manager
from app.services.state_services import state_service
from app.services.checkpoint_store import checkpoint_service
from app.services.artifact_store import artifact_service
from app.utils.stream_manager import stream_manager
from app.utils.task_queue import task_queue
from app.database import async_session 


async def _execute_workflow(run_id: str, payload: dict):
    async with async_session() as db:   
        try:
            # Extract task from payload
            task_description = payload.get("input", "Workflow execution")
            
            # Workflow execution tracking
            workflow_steps = []
            
            # Start workflow
            await stream_manager.broadcast(run_id, {"event": "started", "run_id": run_id})
            
            # Step 1: Planner Node
            await asyncio.sleep(1)
            planner_output = f"Planning workflow for: {task_description}"
            workflow_steps.append({
                "node": "planner",
                "output": planner_output,
                "timestamp": asyncio.get_event_loop().time()
            })
            state_service.save(run_id, {"step": "planning", "payload": payload})
            await stream_manager.broadcast(run_id, {"event": "node_update", "node": "planner", "output": planner_output})
            
            # Step 2: Executor Node
            await asyncio.sleep(1.5)
            executor_output = f"Executing task: {task_description}"
            workflow_steps.append({
                "node": "executor",
                "output": executor_output,
                "timestamp": asyncio.get_event_loop().time()
            })
            checkpoint_service.save(run_id, "execution", {"status": "in_progress"})
            await stream_manager.broadcast(run_id, {"event": "node_update", "node": "executor", "output": executor_output})
            
            # Step 3: Validator Node
            await asyncio.sleep(1.2)
            validator_output = "Workflow execution validated successfully"
            workflow_steps.append({
                "node": "validator",
                "output": validator_output,
                "timestamp": asyncio.get_event_loop().time()
            })
            checkpoint_service.save(run_id, "validation", {"validated": True})
            await stream_manager.broadcast(run_id, {"event": "node_update", "node": "validator", "output": validator_output})
            
            # Generate final output
            final_output = f"Successfully completed workflow for: {task_description}. All nodes executed and validated."
            confidence_score = 0.95
            
            # Create structured artifact
            artifact_data = {
                "task": task_description,
                "steps": workflow_steps,
                "final_output": final_output,
                "confidence_score": confidence_score,
                "run_id": run_id,
                "total_nodes": len(workflow_steps),
                "status": "completed"
            }
            
            # Save artifact
            artifact_json = json.dumps(artifact_data, indent=2)
            aid = artifact_service.save_bytes(run_id, "workflow_result.json", artifact_json.encode('utf-8'))

            # Update run status
            await run_manager.update(db, run_id, status="completed", result={
                "artifact": aid,
                "confidence_score": confidence_score,
                "nodes_executed": len(workflow_steps)
            })
            await stream_manager.broadcast(run_id, {
                "event": "completed", 
                "artifact": aid,
                "confidence_score": confidence_score
            })

        except asyncio.CancelledError:
            await run_manager.update(db, run_id, status="cancelled")
            await stream_manager.broadcast(run_id, {"event": "cancelled", "run_id": run_id})

        except Exception as e:
            await run_manager.update(db, run_id, status="failed", result={"error": str(e)})
            await stream_manager.broadcast(run_id, {"event": "failed", "error": str(e)})