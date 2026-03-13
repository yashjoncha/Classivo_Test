from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from .permissions import IsInstructor

# ── Hardcoded dummy data ──────────────────────────────────────────────

CHAPTERS = {
    1: {
        'id': 1,
        'title': 'Introduction to Python',
        'description': 'Learn the basics of Python programming.',
        'order': 1,
    },
    2: {
        'id': 2,
        'title': 'Data Structures',
        'description': 'Arrays, linked lists, stacks, and queues.',
        'order': 2,
    },
    3: {
        'id': 3,
        'title': 'Object-Oriented Programming',
        'description': 'Classes, inheritance, and polymorphism.',
        'order': 3,
    },
}

QUESTIONS = [
    {
        'id': 1,
        'chapter_id': 1,
        'text': 'What is a variable in Python?',
        'options': ['A container for data', 'A function', 'A loop', 'A module'],
        'correct': 0,
    },
    {
        'id': 2,
        'chapter_id': 2,
        'text': 'Which data structure uses FIFO?',
        'options': ['Stack', 'Queue', 'Tree', 'Graph'],
        'correct': 1,
    },
    {
        'id': 3,
        'chapter_id': 3,
        'text': 'What is inheritance?',
        'options': ['A loop construct', 'A way to reuse code', 'A data type', 'A variable'],
        'correct': 1,
    },
]

_next_chapter_id = 4
_next_question_id = 4


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok'})


# ── Chapter endpoints ─────────────────────────────────────────────────

class ChapterListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsInstructor()]
        return [IsAuthenticated()]

    def get(self, request):
        """GET /api/chapters/ — any authenticated user"""
        return Response(list(CHAPTERS.values()))

    def post(self, request):
        """POST /api/chapters/ — instructor only"""
        global _next_chapter_id
        chapter = {
            'id': _next_chapter_id,
            'title': request.data.get('title', ''),
            'description': request.data.get('description', ''),
            'order': request.data.get('order', _next_chapter_id),
        }
        CHAPTERS[_next_chapter_id] = chapter
        _next_chapter_id += 1
        return Response(chapter, status=status.HTTP_201_CREATED)


class ChapterDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'PUT':
            return [IsInstructor()]
        return [IsAuthenticated()]

    def get(self, request, chapter_id):
        """GET /api/chapters/:id/ — any authenticated user"""
        chapter = CHAPTERS.get(chapter_id)
        if not chapter:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(chapter)

    def put(self, request, chapter_id):
        """PUT /api/chapters/:id/ — instructor only"""
        chapter = CHAPTERS.get(chapter_id)
        if not chapter:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        chapter['title'] = request.data.get('title', chapter['title'])
        chapter['description'] = request.data.get('description', chapter['description'])
        chapter['order'] = request.data.get('order', chapter['order'])
        return Response(chapter)


# ── Question endpoints ────────────────────────────────────────────────

class QuestionCreateView(APIView):
    permission_classes = [IsInstructor]

    def post(self, request):
        """POST /api/questions/ — instructor only"""
        global _next_question_id
        question = {
            'id': _next_question_id,
            'chapter_id': request.data.get('chapter_id'),
            'text': request.data.get('text', ''),
            'options': request.data.get('options', []),
            'correct': request.data.get('correct', 0),
        }
        QUESTIONS.append(question)
        _next_question_id += 1
        return Response(question, status=status.HTTP_201_CREATED)
