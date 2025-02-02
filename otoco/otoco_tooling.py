from cdp_langchain.utils import CdpAgentkitWrapper
from langchain_core.tools.base import BaseToolkit, BaseTool

from otoco.tools.otoco_tool import OtocoTool, get_otoco_actions


class OtocoTooling(BaseToolkit):
    tools: list[BaseTool] = []

    @classmethod
    def from_wrapper(cls, wrapper: CdpAgentkitWrapper) -> "OtocoTooling":
        """Create a OtocoTooling from a CdpAgentkitWrapper.

        Args:
            wrapper: The CdpAgentkitWrapper to create the tools from.

        Returns:
            OtocoTooling: The OtocoTooling instance.

        """

        actions = get_otoco_actions()
        tools = [
            OtocoTool(
                cdp_agentkit_wrapper=wrapper,
                name=action.name,
                description=action.description,
                args_schema=action.args_schema,
                func=action.func,
            )
            for action in actions
        ]
        return cls(tools=tools)

    def get_tools(self):
        return self.tools
