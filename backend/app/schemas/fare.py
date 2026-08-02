from decimal import Decimal

from pydantic import BaseModel


class FarePreviewRead(BaseModel):
    fare: Decimal