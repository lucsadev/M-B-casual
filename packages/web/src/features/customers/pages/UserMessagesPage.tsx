/**
 * UserMessagesPage — /mensajes route.
 *
 * Shows messages sent from the seller/admin to the current user.
 * Messages are about order status changes, payment updates, etc.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useUserMessages, useMarkAsRead } from '../api/use-user-messages';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const TYPE_LABELS: Record<string, string> = {
  order_status: 'Pedido',
  payment_status: 'Pago',
  general: 'General',
};

const TYPE_ICONS: Record<string, string> = {
  order_status: '📦',
  payment_status: '💳',
  general: '📢',
};

export function UserMessagesPage() {
  const navigate = useNavigate();
  const { data: messages, isLoading, isError } = useUserMessages();
  const { mutate: markAsRead } = useMarkAsRead();

  const handleMarkRead = (id: string, orderId?: string) => {
    markAsRead(id);
    if (orderId) {
      navigate(`/orden/${orderId}`);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link to="/perfil" className="text-sm text-[#E8836B] hover:underline">
          ← Volver a mi perfil
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#1A1A1A]">Mensajes</h1>
        <p className="mt-1 text-sm text-[#1A1A1A]/60">
          Notificaciones y comunicaciones del vendedor
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-[#E2E2DC] bg-white p-4">
              <Skeleton className="mb-2 h-5 w-1/3" />
              <Skeleton className="mb-1 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600">
            No se pudieron cargar los mensajes. Intentalo de nuevo más tarde.
          </p>
        </div>
      )}

      {/* Messages list */}
      {!isLoading && !isError && messages && (
        <>
          {messages.length === 0 ? (
            <div className="rounded-lg border border-[#E2E2DC] bg-white p-8 text-center">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-lg font-medium text-[#1A1A1A] mb-2">
                No tenés mensajes
              </p>
              <p className="text-sm text-[#1A1A1A]/60">
                Cuando el vendedor actualice el estado de tus pedidos, recibirás
                notificaciones aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border bg-white p-4 transition-colors hover:bg-[#F0F0EC]/50 ${
                    !msg.isRead ? 'border-l-4 border-l-[#D4A853]' : 'border-[#E2E2DC]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Type badge + title */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {TYPE_ICONS[msg.type] ?? '📢'}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-wide text-[#1A1A1A]/50">
                          {TYPE_LABELS[msg.type] ?? msg.type}
                        </span>
                        {!msg.isRead && (
                          <span className="inline-block h-2 w-2 rounded-full bg-[#D4A853]" />
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-[#1A1A1A]">
                        {msg.title}
                      </h3>

                      {msg.body && (
                        <p className="mt-1 text-sm text-[#1A1A1A]/70">
                          {msg.body}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-[#1A1A1A]/40">
                        {new Date(msg.createdAt).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Action button */}
                    {msg.orderId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkRead(msg.id, msg.orderId)}
                        className="shrink-0 border-[#E8836B] text-[#E8836B] hover:bg-[#E8836B]/10"
                      >
                        Ver orden
                      </Button>
                    )}
                    {!msg.orderId && !msg.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(msg.id)}
                        className="shrink-0 text-xs"
                      >
                        Marcar leído
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
