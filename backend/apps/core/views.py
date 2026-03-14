from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import (
    CreateAPIView,
    ListAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Answer, Chapter, Question
from .permissions import IsInstructor, IsInstructorOrReadOnly
from .serializers import (
    AnswerDetailSerializer,
    AnswerSerializer,
    ChapterDetailSerializer,
    ChapterListSerializer,
    ChapterSerializer,
    QuestionSerializer,
)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok'})


# ── Chapter endpoints ─────────────────────────────────────────────────

class ChapterListCreateView(ListCreateAPIView):
    queryset = Chapter.objects.all()
    permission_classes = [IsInstructorOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ChapterListSerializer
        return ChapterSerializer


class ChapterDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Chapter.objects.prefetch_related('questions')
    permission_classes = [IsInstructorOrReadOnly]
    lookup_field = 'pk'
    lookup_url_kwarg = 'chapter_id'

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ChapterDetailSerializer
        return ChapterSerializer


# ── Question endpoints ────────────────────────────────────────────────

class QuestionListCreateView(ListCreateAPIView):
    serializer_class = QuestionSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsInstructor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Question.objects.all()
        chapter_id = self.request.query_params.get('chapter')
        if chapter_id:
            qs = qs.filter(chapter_id=chapter_id)
        return qs


class QuestionDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    lookup_url_kwarg = 'question_id'

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsInstructor()]
        return [IsAuthenticated()]


# ── Answer endpoints ─────────────────────────────────────────────────

class AnswerCreateView(CreateAPIView):
    serializer_class = AnswerSerializer
    permission_classes = [IsAuthenticated]


class AnswerListView(ListAPIView):
    serializer_class = AnswerDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Answer.objects.select_related('question', 'user')

        # Students see only their own answers, instructors see all
        if user.role == 'student':
            qs = qs.filter(user=user)

        # Optional filters
        chapter_id = self.request.query_params.get('chapter')
        if chapter_id:
            qs = qs.filter(question__chapter_id=chapter_id)

        question_id = self.request.query_params.get('question')
        if question_id:
            qs = qs.filter(question_id=question_id)

        return qs
