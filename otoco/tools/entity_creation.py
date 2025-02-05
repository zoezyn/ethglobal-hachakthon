from enum import Enum
from typing import Callable

from cdp import Wallet
from pydantic import BaseModel, Field

from otoco.tools.action import OtocoAction
from otoco.tools.constants import OTOCO_MASTER_ADDRESS, OTOCO_MASTER_ABI


class Jurisdiction(str, Enum):
    """Jurisdiction list for otoco.
    
    Each jurisdiction has a specific numeric ID used in the smart contract:
    - DELAWARE_COMPANY_LLC ("1"): Delaware Limited Liability Company
    - WYOMING_COMPANY_LLC ("2"): Wyoming Limited Liability Company
    - SWISS_ASSOCIATION ("3"): Swiss Association
    - MARSHALL_ISLANDS_COMPANY_LLC ("4"): Marshall Islands Company LLC
    """
    DELAWARE_COMPANY_LLC = "1"
    WYOMING_COMPANY_LLC = "2"
    SWISS_ASSOCIATION = "3"
    MARSHALL_ISLANDS_COMPANY_LLC = "4"

    @property
    def contract_id(self) -> int:
        """Get the numeric ID used in the smart contract."""
        return int(self.value)

    def __str__(self) -> str:
        """Get the string representation of the jurisdiction."""
        return self.name.lower()

    @property
    def description(self) -> str:
        """Get a human-readable description of the jurisdiction."""
        descriptions = {
            self.DELAWARE_COMPANY_LLC: "Delaware Limited Liability Company",
            self.WYOMING_COMPANY_LLC: "Wyoming Limited Liability Company",
            self.SWISS_ASSOCIATION: "Swiss Association",
            self.MARSHALL_ISLANDS_COMPANY_LLC: "Marshall Islands Company LLC"
        }
        return descriptions[self]


class EntityCreationInput(BaseModel):
    jurisdiction: Jurisdiction = Field(
        ...,
        description="The jurisdiction for entity creation. Options: DELAWARE_COMPANY_LLC (1), WYOMING_COMPANY_LLC (2), SWISS_ASSOCIATION (3), MARSHALL_ISLANDS_COMPANY_LLC (4)"
    )
    name: str = Field(..., description="The name of the entity or company to be created")


def create_entity(wallet: Wallet, jurisdiction: Jurisdiction, name: str) -> str:
    """Use the smart contract from Otoco master to create a series company or a company in a jurisdiction.

    Args:
        wallet (Wallet): The wallet to deploy the contract from.
        jurisdiction (Jurisdiction): The jurisdiction for the entity creation (numeric ID 1-4).
        name (str): The name of the entity or company.

    Returns:
        str: The transaction link for the created entity.
    """
    try:
        contract = wallet.invoke_contract(
            contract_address=OTOCO_MASTER_ADDRESS,
            abi=OTOCO_MASTER_ABI,
            method="createSeries",
            args={"jurisdiction": jurisdiction.value, "controller": wallet.addresses[0].address_id, "name": name},
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
