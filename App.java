import java.util.Scanner;

public class App {

    // ── Atributos ────────────────────────────────────────────────
    private static final int MAX_BOLETINS = 3;
    private static Boletim[] boletins = new Boletim[MAX_BOLETINS];
    private static Scanner scanner = new Scanner(System.in);


    // ── Main ─────────────────────────────────────────────────────
    public static void main(String[] args) {
        char aplic = 'a';

        switch (aplic) {
            case 'a': // Leitura
                lerBoletim();
                break;

            case 'b': // Print
                if (boletins[0] != null) {
                    boletins[0].printBoletim();
                } else {
                    System.out.println("Nenhum boletim cadastrado.");
                }
                break;

            case 'c': // Mudar status
                if (boletins[0] != null) {
                    boletins[0].setStatus("AN");
                } else {
                    System.out.println("Nenhum boletim cadastrado.");
                }
                break;

            case 'd': // Formalizar recebimento
                formalizarRecebimento(0);
                break;

            default:
                System.out.println("Opção inválida.");
        }
    }


    // ── Métodos ───────────────────────────────────────────────────

    private static void lerBoletim() {
        String obs;
        int mes, ano;

        // Criação do boletim
        System.out.println("Nome do Observador:");
        obs = scanner.nextLine();

        System.out.println("Mês:");
        mes = lerInteiro();

        System.out.println("Ano:");
        ano = lerInteiro();

        // Verificar se já existe boletim desse mês/ano
        for (int i = 0; i < boletins.length; i++) {
            if (boletins[i] != null &&
                boletins[i].getAno() == ano &&
                boletins[i].getMes() == mes) {
                System.out.println("Boletim já existe no sistema.");
                return;
            }
        }

        // Criar o boletim
        Boletim novoBoletim = new Boletim(obs, mes, ano);

        // Preencher os dados do boletim
        for (int i = 0; i < 31; i++) {
            for (int j = 0; j < 4; j++) {
                System.out.printf("Dado [Dia %2d | Coluna %d]: ", i + 1, j + 1);
                int dado = lerInteiro();
                novoBoletim.setDadosBole(i, j, dado);
            }
        }

        // Salvar o boletim no array
        boolean salvo = false;
        for (int i = 0; i < boletins.length; i++) {
            if (boletins[i] == null) {
                boletins[i] = novoBoletim;
                salvo = true;
                System.out.println("Boletim salvo com sucesso.");
                break;
            }
        }

        if (!salvo) {
            System.out.println("Não há espaço para novos boletins.");
        }
    }

    private static void formalizarRecebimento(int indice) {
        if (boletins[indice] == null) {
            System.out.println("Boletim não encontrado.");
            return;
        }

        System.out.println("Mês de recebimento:");
        int mesReceb = lerInteiro();

        System.out.println("Ano de recebimento:");
        int anoReceb = lerInteiro();

        boletins[indice].setMesReceb(mesReceb);
        boletins[indice].setAnoReceb(anoReceb);
        boletins[indice].setRecebido(true);
        boletins[indice].setStatus("RC");

        System.out.printf("Recebimento do boletim %02d/%d formalizado.%n",
            boletins[indice].getMes(), boletins[indice].getAno());
    }

    // Lê um inteiro com segurança, descartando entradas inválidas
    private static int lerInteiro() {
        while (!scanner.hasNextInt()) {
            System.out.println("Entrada inválida. Digite um número inteiro:");
            scanner.nextLine();
        }
        int valor = scanner.nextInt();
        scanner.nextLine(); // limpa o buffer
        return valor;
    }
}
