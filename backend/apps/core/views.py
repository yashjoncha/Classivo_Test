from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import CreateAPIView, ListCreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Chapter, Question
from .permissions import IsInstructor, IsInstructorOrReadOnly
from .serializers import AnswerSerializer, ChapterSerializer, QuestionSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok'})


# ── Chapter endpoints ─────────────────────────────────────────────────

class ChapterListCreateView(ListCreateAPIView):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    permission_classes = [IsInstructorOrReadOnly]


class ChapterDetailView(RetrieveUpdateAPIView):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer
    permission_classes = [IsInstructorOrReadOnly]
    lookup_field = 'pk'
    lookup_url_kwarg = 'chapter_id'


# ── Question endpoints ────────────────────────────────────────────────

class QuestionCreateView(CreateAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsInstructor]


# ── Answer endpoints ─────────────────────────────────────────────────

class AnswerCreateView(CreateAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]
