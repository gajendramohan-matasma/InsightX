"""
Import all ORM models so Alembic and other tools can discover them.
"""

from app.models.database import Base
from app.models.user import User, UserRole
from app.models.conversation import Conversation, ConversationStatus, Message, MessageRole
from app.models.analytics_log import AnalyticsLog
from app.models.error_log import ErrorLog, ErrorSeverity
from app.models.usage_metric import UsageMetric
from app.models.data_cube import DataCube, DataCubeStatus

__all__ = [
    "Base",
    "User",
    "UserRole",
    "Conversation",
    "ConversationStatus",
    "Message",
    "MessageRole",
    "AnalyticsLog",
    "ErrorLog",
    "ErrorSeverity",
    "UsageMetric",
    "DataCube",
    "DataCubeStatus",
]
