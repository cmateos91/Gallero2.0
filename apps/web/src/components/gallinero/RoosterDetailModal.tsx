import { useState } from "react";
import type { RoosterDto } from "../../types/api.js";
import { renameRooster, careRooster, trainRooster, feedRooster, drinkRooster, sellRooster, removeDeadRooster } from "../../lib/api/roosters.js";
import { Modal } from "../ui/Modal.js";
import { Button } from "../ui/Button.js";
import { Input } from "../ui/Input.js";
import { Badge } from "../ui/Badge.js";
import { useToast } from "../../context/toast.js";
import styles from "./RoosterDetailModal.module.css";

interface RoosterDetailModalProps {
  rooster: RoosterDto;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onFusionSelect?: () => void;
}

export function RoosterDetailModal({
  rooster,
  open,
  onClose,
  onUpdated,
  onFusionSelect,
}: RoosterDetailModalProps) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(rooster.name);
  const [loading, setLoading] = useState("");
  const { pushToast } = useToast();

  async function action(fn: () => Promise<unknown>, name: string) {
    setLoading(name);
    try {
      await fn();
      pushToast(`${name} completado`, "success");
      onUpdated();
    } catch {
      pushToast(`Error en ${name}`, "error");
    } finally {
      setLoading("");
    }
  }

  async function handleRename() {
    if (!newName.trim() || newName === rooster.name) {
      setEditingName(false);
      return;
    }
    setLoading("rename");
    try {
      await renameRooster(rooster.id, newName.trim());
      onUpdated();
      setEditingName(false);
    } catch {
      pushToast("Error al renombrar", "error");
    } finally {
      setLoading("");
    }
  }

  const avgStats = Math.round(
    (rooster.attack + rooster.defense + rooster.speed + rooster.resistance) / 4,
  );

  return (
    <Modal open={open} onClose={onClose} title={rooster.name}>
      <div className={styles.body}>
        <div className={styles.statsGrid}>
          <div className={styles.stat}><span className={styles.statVal}>{rooster.attack}</span><span>ATK</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{rooster.defense}</span><span>DEF</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{rooster.speed}</span><span>SPD</span></div>
          <div className={styles.stat}><span className={styles.statVal}>{rooster.resistance}</span><span>RES</span></div>
        </div>
        <p className={styles.avg}>Promedio: {avgStats}</p>

        {rooster.nature && <Badge variant="warning">{rooster.nature}</Badge>}
        <Badge>{rooster.quality}</Badge>

        {!rooster.isDead && (
          <div className={styles.bars}>
            <div className={styles.barRow}><span>Hambre</span><div className={styles.bar}><div className={styles.fill} style={{ width: `${rooster.hungerValue}%`, background: "#e67e22" }} /></div></div>
            <div className={styles.barRow}><span>Sed</span><div className={styles.bar}><div className={styles.fill} style={{ width: `${rooster.thirstValue}%`, background: "#3498db" }} /></div></div>
            <div className={styles.barRow}><span>Cuidado</span><div className={styles.bar}><div className={styles.fill} style={{ width: `${rooster.careCurrent}%`, background: "#e74c3c" }} /></div></div>
            {rooster.stage === "POLLO" && (
              <div className={styles.barRow}><span>Crecim.</span><div className={styles.bar}><div className={styles.fill} style={{ width: `${rooster.growthProgress}%`, background: "#2ecc71" }} /></div></div>
            )}
          </div>
        )}

        {editingName ? (
          <div className={styles.rename}>
            <Input value={newName} onChange={(e) => { setNewName(e.target.value); }} autoFocus />
            <Button variant="secondary" onClick={handleRename} loading={loading === "rename"}>Guardar</Button>
            <Button variant="ghost" onClick={() => setEditingName(false)}>Cancelar</Button>
          </div>
        ) : (
          <div className={styles.actions}>
            {!rooster.isDead && (
              <>
                <Button variant="secondary" onClick={() => action(() => careRooster(rooster.id), "Cuidar")} loading={loading === "Cuidar"}>Cuidar</Button>
                <Button variant="secondary" onClick={() => action(() => trainRooster(rooster.id), "Entrenar")} loading={loading === "Entrenar"}>Entrenar</Button>
                <Button variant="secondary" onClick={() => action(() => feedRooster(rooster.id), "Alimentar")} loading={loading === "Alimentar"}>Alimentar</Button>
                <Button variant="secondary" onClick={() => action(() => drinkRooster(rooster.id), "Beber")} loading={loading === "Beber"}>Agua</Button>
              </>
            )}
            {rooster.stage === "ADULTO" && !rooster.isDead && onFusionSelect && (
              <Button variant="ghost" onClick={onFusionSelect}>Seleccionar para fusión</Button>
            )}
            <Button variant="ghost" onClick={() => setEditingName(true)}>Renombrar</Button>
            {!rooster.isDead && (
              <Button variant="danger" onClick={() => action(() => sellRooster(rooster.id), "Vender")} loading={loading === "Vender"}>Matadero</Button>
            )}
            {rooster.isDead && (
              <Button variant="danger" onClick={() => action(() => removeDeadRooster(rooster.id), "Enterrar")} loading={loading === "Enterrar"}>Enterrar</Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
