import { useState } from "react";
import type { RoosterDto } from "../../types/api.js";
import { fuseRoosters } from "../../lib/api/roosters.js";
import { Modal } from "../ui/Modal.js";
import { Button } from "../ui/Button.js";
import { RoosterCard } from "./RoosterCard.js";
import { useToast } from "../../context/toast.js";
import styles from "./FusionModal.module.css";

interface FusionModalProps {
  adults: RoosterDto[];
  open: boolean;
  onClose: () => void;
  onFused: () => void;
}

export function FusionModal({ adults, open, onClose, onFused }: FusionModalProps) {
  const [first, setFirst] = useState<string | null>(null);
  const [second, setSecond] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToast();

  function toggle(id: string) {
    if (first === id) { setFirst(null); return; }
    if (second === id) { setSecond(null); return; }
    if (!first) { setFirst(id); return; }
    if (!second) { setSecond(id); return; }
  }

  async function handleFuse() {
    if (!first || !second) return;
    setLoading(true);
    try {
      await fuseRoosters(first, second);
      pushToast("¡Fusión completada! Revisa tus huevos", "success");
      onFused();
    } catch {
      pushToast("Error en la fusión", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setFirst(null);
    setSecond(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Fusionar gallos">
      <div className={styles.body}>
        <p className={styles.hint}>
          Selecciona 2 gallos adultos. Sus stats se promediarán para crear un nuevo huevo.
        </p>
        <div className={styles.list}>
          {adults.map((r) => (
            <RoosterCard
              key={r.id}
              rooster={r}
              selected={first === r.id || second === r.id}
              onClick={() => toggle(r.id)}
            />
          ))}
        </div>
        {first && second && (
          <Button onClick={handleFuse} loading={loading}>
            Fusionar
          </Button>
        )}
      </div>
    </Modal>
  );
}
