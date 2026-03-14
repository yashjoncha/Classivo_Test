from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .models import Answer, Chapter, Question


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'chapter', 'text', 'options', 'correct', 'created_at']
        read_only_fields = ['created_at']


class ChapterListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list endpoint — excludes large content field."""
    class Meta:
        model = Chapter
        fields = ['id', 'title', 'description', 'order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ['id', 'title', 'description', 'content', 'order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ChapterDetailSerializer(serializers.ModelSerializer):
    """Chapter with nested questions — used for GET detail."""
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Chapter
        fields = ['id', 'title', 'description', 'content', 'order', 'questions', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class AnswerSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    is_correct = serializers.BooleanField(read_only=True)

    class Meta:
        model = Answer
        fields = ['id', 'question', 'user', 'selected_option', 'is_correct', 'created_at']
        read_only_fields = ['created_at']
        validators = [
            UniqueTogetherValidator(
                queryset=Answer.objects.all(),
                fields=['question', 'user'],
                message='You have already answered this question.',
            )
        ]


class AnswerDetailSerializer(serializers.ModelSerializer):
    """Read-only serializer showing answer with question text."""
    question_text = serializers.CharField(source='question.text', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Answer
        fields = ['id', 'question', 'question_text', 'user', 'username', 'selected_option', 'is_correct', 'created_at']
        read_only_fields = ['is_correct', 'created_at']
