from django.db import models


class Chapter(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    content = models.JSONField(default=list, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def save(self, *args, **kwargs):
        if self._state.adding and self.order == 0:
            max_order = Chapter.objects.aggregate(models.Max('order'))['order__max']
            self.order = (max_order or 0) + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Question(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    options = models.JSONField(default=list)
    correct = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.text[:80]


class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='answers')
    selected_option = models.PositiveIntegerField()
    is_correct = models.BooleanField(editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['question', 'user'], name='unique_answer_per_user'),
        ]

    def save(self, *args, **kwargs):
        self.is_correct = self.selected_option == self.question.correct
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user} - {self.question}'
