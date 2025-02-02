from typing import Any, Callable
from cdp_langchain.utils.cdp_agentkit_wrapper import CdpAgentkitWrapper
from langchain_core.tools import BaseTool
from pydantic import BaseModel
from langchain_core.callbacks import CallbackManagerForToolRun

from otoco.tools.action import OtocoAction

from otoco.tools.entity_creation import EntityCreationAction


def get_otoco_actions() -> list[OtocoAction]:
    """Get all the Otoco actions."""
    return [action() for action in OtocoAction.__subclasses__()]


class OtocoTool(BaseTool):
    """Otoco Tool for interacting with otoco smart contracts."""

    cdp_agentkit_wrapper: CdpAgentkitWrapper
    name: str = ""
    description: str = ""
    args_schema: type[BaseModel] | None = None
    func: Callable[..., str]

    def _run(
        self,
        instructions: str | None = "",
        run_manager: CallbackManagerForToolRun | None = None,
        **kwargs: Any,
    ) -> str:
        """Run the otoco tools for entity management and creation."""
        if not instructions or instructions == "{}":
            # Catch other forms of empty input that GPT-4 likes to send.
            instructions = ""
        if self.args_schema is not None:
            validated_input_data = self.args_schema(**kwargs)
            parsed_input_args = validated_input_data.model_dump()
        else:
            parsed_input_args = {"instructions": instructions}
        return self.cdp_agentkit_wrapper.run_action(self.func, **parsed_input_args)


__all__ = ["OtocoTool", "get_otoco_actions", "EntityCreationAction"]
