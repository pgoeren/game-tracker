/**
 * PlayerAvatar — shows a player's photo if they have one, otherwise their
 * colored initial. Pass className to control size + shape.
 *
 * Example:
 *   <PlayerAvatar player={p} className="w-10 h-10 rounded-full text-lg" />
 */
export default function PlayerAvatar({ player, className = '', style = {} }) {
  if (!player) return null;
  return (
    <div
      className={`flex items-center justify-center overflow-hidden shrink-0 font-bold text-white ${className}`}
      style={{ backgroundColor: player.avatar_url ? undefined : player.color, ...style }}>
      {player.avatar_url
        ? <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
        : <span>{player.name.charAt(0).toUpperCase()}</span>}
    </div>
  );
}
