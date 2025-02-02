from typing import Callable
from pydantic import BaseModel


class OtocoAction(BaseModel):
    """OtoCo Action Base Class."""

    name: str
    description: str
    args_schema: type[BaseModel] | None = None
    func: Callable[..., str]
