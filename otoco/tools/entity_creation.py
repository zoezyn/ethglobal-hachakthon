from enum import Enum
from typing import Callable

from cdp import Wallet

from otoco.tools.action import OtocoAction
from pydantic import BaseModel
from otoco.tools.constants import OTOCO_MASTER_ADDRESS, OTOCO_MASTER_ABI


class Jurisdiction(int, Enum):
    """Jurisdiction list for otoco. Allowed values are:
       - DELAWARE_COMPANY_LLC: Represents a Delaware limited liability company with id 1.
       - WYOMING_COMPANY_LLC: Represents a Wyoming limited liability company with id 2.
       - SWISS_ASSOCIATION: Represents a Swiss association with id 3.
       - MARSHALL_ISLANDS_COMPANY_LLC: Represents a Marshall Islands company LLC with id 4.

       Each enum member's value serves as the numeric jurisdiction id required by the smart contract.
       Always pass the enum member's value (e.g. jurisdiction.value) when interacting with the contract.
    """
    DELAWARE_COMPANY_LLC = 1
    WYOMING_COMPANY_LLC = 2
    SWISS_ASSOCIATION = 3
    MARSHALL_ISLANDS_COMPANY_LLC = 4


class EntityCreationInput(BaseModel):
    jurisdiction: Jurisdiction
    name: str


def create_entity(wallet: Wallet, jurisdiction: Jurisdiction, name: str) -> str:
    """Use the smart contract from Otoco master to create a series company or a company in a jurisdiction.

    Args:
        wallet (Wallet): The wallet to deploy the contract from.
        jurisdiction (Jurisdiction): The jurisdiction id for the entity creation inside otoco master smart contract.
        name (str): The name of the entity or company.

    Note:
        Ensure that you pass the jurisdiction id as a number by using jurisdiction.value.

    Returns:
        address (str): The address of the created entity or company.
    """

    try:
        contract = wallet.invoke_contract(
            contract_address=OTOCO_MASTER_ADDRESS,
            abi=OTOCO_MASTER_ABI,
            method="createSeries",
            args={"jurisdiction": f"{jurisdiction.value}", "controller": wallet.addresses[0].address_id, "name": name},
            amount=0.000328,
            asset_id="eth"
        )
        contract.wait()
        return f"Entity created successfully: {contract.transaction_link}"

    except Exception as e:
        print(e)
        raise e


class EntityCreationAction(OtocoAction):
    """OtoCo Entity Creation Action."""

    name: str = "entity_creation"
    description: str = "Create an entity on otoco with the given jurisdiction and name."
    args_schema: type[BaseModel] | None = EntityCreationInput
    func: Callable[..., str] = create_entity
