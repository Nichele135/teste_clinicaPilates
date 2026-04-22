// Componente de ajuste de limite de alunos (Stepper + / -)
// Você pode colar isso dentro da sua tela de ADMIN (override)

import { useState } from "react";
import { Button } from "@/components/ui/button";

function AjusteMaxStudents({ value = 3, onChange }) {
  const [maxStudents, setMaxStudents] = useState(value);

  function updateValue(newValue) {
    setMaxStudents(newValue);
    if (onChange) onChange(newValue);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Máximo de alunos</label>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => updateValue(Math.max(1, maxStudents - 1))}
        >
          -
        </Button>

        <div className="flex h-10 min-w-16 items-center justify-center rounded-md border px-4 font-semibold">
          {maxStudents}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => updateValue(Math.min(5, maxStudents + 1))}
        >
          +
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Escolha entre 1 e 5 alunos.
      </p>
    </div>
  );
}

export default AjusteMaxStudents;
