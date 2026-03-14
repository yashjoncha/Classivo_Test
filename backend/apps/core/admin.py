from django.contrib import admin

from .models import Answer, Chapter, Question


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['title', 'order', 'created_at']
    list_editable = ['order']
    search_fields = ['title']
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'chapter', 'correct', 'created_at']
    list_filter = ['chapter']
    search_fields = ['text']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['user', 'question', 'selected_option', 'is_correct', 'created_at']
    list_filter = ['is_correct', 'question__chapter']
    search_fields = ['user__username']
    readonly_fields = ['is_correct']
