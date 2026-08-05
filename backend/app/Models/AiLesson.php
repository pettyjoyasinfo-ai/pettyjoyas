<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiLesson extends Model
{
    protected $fillable = ['content', 'active'];

    protected $casts = ['active' => 'boolean'];
}
