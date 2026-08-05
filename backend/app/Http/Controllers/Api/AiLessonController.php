<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiLesson;
use Illuminate\Http\Request;

/**
 * "Aprendizajes" de la IA (instrucciones/conocimiento). Cada uno es una clase
 * editable o eliminable; se aplican tanto al chatbot de WhatsApp como al de la
 * tienda. Los lee ChatbotService y los inyecta en el prompt.
 */
class AiLessonController extends Controller
{
    public function index()
    {
        return response()->json(
            AiLesson::orderByDesc('id')->get()->map(fn ($l) => $this->json($l))
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:2000'],
            'active'  => ['sometimes', 'boolean'],
        ]);
        $lesson = AiLesson::create($data);

        return response()->json($this->json($lesson), 201);
    }

    public function update(Request $request, AiLesson $lesson)
    {
        $data = $request->validate([
            'content' => ['sometimes', 'required', 'string', 'max:2000'],
            'active'  => ['sometimes', 'boolean'],
        ]);
        $lesson->update(array_filter($data, fn ($v) => $v !== null));

        return response()->json($this->json($lesson));
    }

    public function destroy(AiLesson $lesson)
    {
        $lesson->delete();

        return response()->noContent();
    }

    private function json(AiLesson $l): array
    {
        return [
            'id'      => $l->id,
            'content' => $l->content,
            'active'  => (bool) $l->active,
        ];
    }
}
