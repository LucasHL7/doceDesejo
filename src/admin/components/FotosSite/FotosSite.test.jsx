import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  excluirFotoGaleria,
  gerarId,
  salvarFotoGaleria,
  salvarImagemSite,
  salvarOrdem,
} from '../../../firebase/conteudo.js';
import { comprimirImagem } from '../../imagem.js';
import { imagensSitePadrao } from '../../../data/imagensPadrao.js';
import FotosSite from './FotosSite.jsx';

vi.mock('../../../firebase/conteudo.js', () => ({
  getApp: vi.fn(),
  salvarImagemSite: vi.fn(),
  salvarFotoGaleria: vi.fn(),
  excluirFotoGaleria: vi.fn(),
  salvarOrdem: vi.fn(),
  gerarId: vi.fn(),
}));
vi.mock('../../imagem.js', () => ({ comprimirImagem: vi.fn() }));

const galeriaInicial = [
  { id: 'g1', src: 'g1.webp', alt: 'Primeira', ordem: 0 },
  { id: 'g2', src: 'g2.webp', alt: 'Segunda', ordem: 1 },
  { id: 'g3', src: 'g3.webp', ordem: 4 },
];

let avisar;
let estado;
function Cena({ galeria = galeriaInicial, imagensSite = { hero: { src: 'hero.webp', alt: 'Bolo' } } }) {
  const [g, setG] = useState(galeria);
  const [i, setI] = useState(imagensSite);
  estado = { galeria: g, imagensSite: i };
  return <FotosSite galeria={g} setGaleria={setG} imagensSite={i} setImagensSite={setI} avisar={avisar} />;
}

const espaco = (nome) => screen.getByText(nome, { selector: '.adm-label' }).closest('.fotos-espaco');
const fotosGaleria = () => estado.galeria.map((f) => f.id);
const inputGaleria = () => document.querySelector('.fotos-galeria input[type="file"]');
const arquivo = (nome) => new File(['x'], nome, { type: 'image/jpeg' });

let contador;
beforeEach(() => {
  vi.clearAllMocks();
  avisar = vi.fn();
  contador = 0;
  gerarId.mockImplementation(() => `nova-${++contador}`);
});

describe('FotosSite: fotos fixas', () => {
  it('mostra as quatro fotos fixas, usando o padrão quando não há no Firebase', () => {
    render(<Cena />);
    // fotos decorativas aqui (alt vazio), então busca a <img> direto
    expect(espaco('Foto principal (topo do site)').querySelector('img')).toHaveAttribute('src', 'hero.webp');
    expect(espaco('Delivery: foto 1').querySelector('img')).toHaveAttribute(
      'src',
      imagensSitePadrao['delivery-1'].src
    );
    expect(within(espaco('Delivery: foto 2')).getByRole('button', { name: 'Salvo' })).toBeDisabled();
  });

  it('trocar a descrição e salvar grava no Firebase e avisa', async () => {
    const user = userEvent.setup();
    salvarImagemSite.mockResolvedValue();
    render(<Cena />);
    const bloco = within(espaco('Foto principal (topo do site)'));

    await user.type(bloco.getByRole('textbox', { name: /Descrição da foto/ }), ' bonito ');
    await user.click(bloco.getByRole('button', { name: 'Salvar' }));

    expect(salvarImagemSite).toHaveBeenCalledWith('hero', { src: 'hero.webp', alt: 'Bolo bonito' });
    expect(avisar).toHaveBeenCalledWith('Foto salva!');
    expect(estado.imagensSite.hero).toEqual({ src: 'hero.webp', alt: 'Bolo bonito' });
  });

  it('trocar a foto usa o tamanho certo para cada espaço; erro ao salvar aparece', async () => {
    const user = userEvent.setup();
    comprimirImagem.mockResolvedValue('data:image/webp;base64,NOVA');
    salvarImagemSite.mockRejectedValue({ code: 'permission-denied' });
    render(<Cena />);

    const bloco = espaco('Delivery: foto 3');
    await user.upload(bloco.querySelector('input[type="file"]'), arquivo('d3.jpg'));
    expect(comprimirImagem).toHaveBeenCalledWith(expect.any(File), { maxLado: 900 });
    await user.click(within(bloco).getByRole('button', { name: 'Salvar' }));

    expect(await within(bloco).findByRole('alert')).toHaveTextContent('Sem permissão');
    expect(within(bloco).getByRole('button', { name: 'Salvar' })).toBeEnabled();
    expect(avisar).not.toHaveBeenCalled();
  });

  it('espaço sem foto nenhuma começa vazio', () => {
    render(<Cena imagensSite={{ hero: {} }} />);
    expect(within(espaco('Foto principal (topo do site)')).getByText('Escolher foto')).toBeInTheDocument();
  });
});

describe('FotosSite: carrossel', () => {
  it('lista vazia explica o que acontece no site', () => {
    render(<Cena galeria={[]} />);
    expect(screen.getByText(/Nenhuma foto no carrossel/)).toBeInTheDocument();
  });

  it('adiciona várias fotos de uma vez, no fim da ordem', async () => {
    const user = userEvent.setup();
    comprimirImagem.mockImplementation(async (f) => `data:${f.name}`);
    salvarFotoGaleria.mockResolvedValue();
    render(<Cena />);

    await user.upload(inputGaleria(), [arquivo('a.jpg'), arquivo('b.jpg')]);

    expect(comprimirImagem).toHaveBeenCalledWith(expect.any(File), { maxLado: 1000 });
    expect(salvarFotoGaleria).toHaveBeenNthCalledWith(1, expect.objectContaining({ src: 'data:a.jpg', ordem: 5 }));
    expect(salvarFotoGaleria).toHaveBeenNthCalledWith(2, expect.objectContaining({ src: 'data:b.jpg', ordem: 6 }));
    expect(estado.galeria).toHaveLength(5);
    expect(avisar).toHaveBeenCalledWith('2 fotos adicionadas!');
    expect(screen.getByRole('button', { name: /Adicionar fotos/ })).toBeEnabled();
  });

  it('fotos antigas sem `ordem` contam como 0 ao calcular a próxima', async () => {
    const user = userEvent.setup();
    comprimirImagem.mockResolvedValue('data:x');
    salvarFotoGaleria.mockResolvedValue();
    render(<Cena galeria={[{ id: 'velha', src: 'v.jpg', alt: 'V' }]} />);
    await user.upload(inputGaleria(), arquivo('a.jpg'));
    expect(salvarFotoGaleria).toHaveBeenCalledWith(expect.objectContaining({ ordem: 1 }));
  });

  it('se o navegador não der a lista de arquivos, não faz nada', () => {
    render(<Cena />);
    const input = inputGaleria();
    Object.defineProperty(input, 'files', { configurable: true, value: null });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(comprimirImagem).not.toHaveBeenCalled();
  });

  it('uma foto numa galeria vazia começa na ordem 0', async () => {
    const user = userEvent.setup();
    comprimirImagem.mockResolvedValue('data:x');
    salvarFotoGaleria.mockResolvedValue();
    render(<Cena galeria={[]} />);
    await user.upload(inputGaleria(), arquivo('a.jpg'));
    expect(salvarFotoGaleria).toHaveBeenCalledWith(expect.objectContaining({ ordem: 0, alt: 'Bolo confeitado decorado' }));
    expect(avisar).toHaveBeenCalledWith('Foto adicionada!');
  });

  it('mostra o progresso e lista as fotos que falharam', async () => {
    const user = userEvent.setup();
    let liberar;
    comprimirImagem
      .mockImplementationOnce(() => new Promise((r) => (liberar = () => r('data:ok'))))
      .mockRejectedValueOnce(new Error('Foto grande demais'));
    salvarFotoGaleria.mockResolvedValue();
    render(<Cena />);

    const envio = user.upload(inputGaleria(), [arquivo('ok.jpg'), arquivo('ruim.jpg')]);
    expect(await screen.findByRole('button', { name: /Enviando 1 de 2…/ })).toBeDisabled();
    liberar();
    await envio;

    expect(await screen.findByRole('alert')).toHaveTextContent('ruim.jpg: Foto grande demais');
    expect(avisar).toHaveBeenCalledWith('Foto adicionada!');
  });

  it('escolher nenhum arquivo não faz nada', async () => {
    render(<Cena />);
    inputGaleria().dispatchEvent(new Event('change', { bubbles: true }));
    expect(comprimirImagem).not.toHaveBeenCalled();
  });

  it('o botão abre o seletor de arquivos', async () => {
    const user = userEvent.setup();
    render(<Cena />);
    const clique = vi.spyOn(inputGaleria(), 'click');
    await user.click(screen.getByRole('button', { name: /Adicionar fotos/ }));
    expect(clique).toHaveBeenCalled();
  });

  it('reordena e salva; se falhar, volta como estava', async () => {
    const user = userEvent.setup();
    salvarOrdem.mockResolvedValueOnce().mockRejectedValueOnce({ code: 'unavailable' });
    render(<Cena />);
    expect(screen.getByRole('button', { name: 'Mover foto 1 para antes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mover foto 3 para depois' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Mover foto 1 para depois' }));
    expect(fotosGaleria()).toEqual(['g2', 'g1', 'g3']);
    expect(salvarOrdem).toHaveBeenCalledWith('galeria', [
      expect.objectContaining({ id: 'g2', ordem: 0 }),
      expect.objectContaining({ id: 'g1', ordem: 1 }),
      expect.objectContaining({ id: 'g3', ordem: 2 }),
    ]);

    await user.click(screen.getByRole('button', { name: 'Mover foto 3 para antes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('O Firebase não respondeu.');
    expect(fotosGaleria()).toEqual(['g2', 'g1', 'g3']);
  });

  it('remover pede confirmação', async () => {
    const user = userEvent.setup();
    excluirFotoGaleria.mockResolvedValueOnce().mockRejectedValueOnce(new Error('falhou'));
    render(<Cena />);

    await user.click(screen.getByRole('button', { name: 'Remover foto 1' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }));
    expect(excluirFotoGaleria).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Remover foto 1' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }));
    expect(excluirFotoGaleria).toHaveBeenCalledWith('g1');
    expect(fotosGaleria()).toEqual(['g2', 'g3']);
    expect(avisar).toHaveBeenCalledWith('Foto removida');

    await user.click(screen.getByRole('button', { name: 'Remover foto 1' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Remover' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('falhou');
    expect(fotosGaleria()).toEqual(['g2', 'g3']);
  });

  it('salva a descrição ao sair do campo ou apertar Enter, só se mudou', async () => {
    const user = userEvent.setup();
    salvarFotoGaleria.mockResolvedValueOnce().mockRejectedValueOnce({ code: 'unauthenticated' });
    render(<Cena />);

    const desc1 = screen.getByRole('textbox', { name: 'Descrição da foto 1' });
    await user.click(desc1);
    await user.tab();
    expect(salvarFotoGaleria).not.toHaveBeenCalled();

    await user.type(desc1, ' nova{Enter}');
    expect(salvarFotoGaleria).toHaveBeenCalledWith({ id: 'g1', src: 'g1.webp', alt: 'Primeira nova', ordem: 0 });
    expect(avisar).toHaveBeenCalledWith('Descrição salva');
    expect(estado.galeria[0].alt).toBe('Primeira nova');

    // foto sem descrição: qualquer texto conta como mudança
    const desc3 = screen.getByRole('textbox', { name: 'Descrição da foto 3' });
    await user.type(desc3, 'Terceira{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Sua sessão expirou.');
  });
});
